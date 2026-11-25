import { mountExploration, exploreRoute } from './exploration.js';
import { guideActive, guideChrome, showPresentation } from './presentation.js';
import { projectData } from './project-data.js';
import { projectsPage, projectDetail, projectResults, versionList, escapeText as escape } from './projects.js';
import { mountInspection } from './inspection.js';
import { projectOverview, studioEntry, clinicPage, settingsPage, navigation, serviceName } from './workspace.js';
navigation();
import { mountStudio } from './studio/studio.js';

const screen = document.querySelector('#screen');
const dialog = document.querySelector('#dialog');
const feedback = document.querySelector('#feedback');
const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' });
const routes = new Set(['inicio', 'projetos', 'studio', 'aurea', 'conta', 'configuracoes','apresentacao']);
const state = {
  client: null, session: null, phase: 'loading', projects: [], profile: null,
  accountMode: new URLSearchParams(location.search).has('recuperar') ? 'recovery' : 'login'
};
const filters = { search:'', sort:'recent', view:'grade' };
const privateRoute = /^projetos(?:\/[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12})?$/i;
let destination = 'inicio';
let sessionController;
let workspaceRead = 0;
let recoveryUser;
let verification = 0;
let pendingRecovery;
let historyView;
let messageTimer;
let closeStudio;
let explorer;
let explorerKey = '';
let studioRoute = '';
let temporary;
let displayedHash = '';
let inspectionKey = '';
let disposeInspection;

// The SDK only emits PASSWORD_RECOVERY after a successful PKCE exchange.
// Open the recovery screen even if there is no verifier in this browser.
if (state.accountMode === 'recovery') {
  const url = new URL(location.href);
  url.hash = 'conta';
  history.replaceState(null, '', url);
}

function notice(text, error = false) {
  clearTimeout(messageTimer);
  feedback.textContent = text;
  feedback.hidden = false;
  feedback.toggleAttribute('data-error', error);
  messageTimer = setTimeout(() => { feedback.hidden = true; }, 11000);
}

function heading(title, description) {
  return `<div class="intro"><h1>${title}</h1><p class="muted">${description}</p></div>`;
}

function button(label, action, style = '') {
  return `<button type="button" class="${style}" data-action="${action}">${label}</button>`;
}

function projectList(projects) {
  if (!projects.length) return '<p class="muted">Você ainda não tem projetos.</p>';
  return `<ul class="project-list">${projects.map(project => `<li>
    <button type="button" data-action="details" data-id="${escape(project.id)}">${escape(project.title)}</button>
    <p>${escape(project.description)}</p><small>ID · ${escape(project.id)}</small><small>Atualizado em ${dateFormat.format(new Date(project.updated_at))}</small>
  </li>`).join('')}</ul>`;
}

function projectStatus() {
  if (state.phase === 'loading') return '<p>Carregando projetos…</p>';
  if (state.phase === 'identity-error') return '<p role="alert">Não foi possível verificar a sessão.</p>'+button('Verificar sessão','verify','secondary')+' '+button('Sair desta sessão','logout','secondary');
  if (state.phase === 'error') return `<p>Não foi possível carregar seus dados.</p>${button('Tentar novamente','retry')}`;
  if (state.phase === 'config-error') return '<p role="alert">Falha ao iniciar a conexão. Recarregue a página para tentar novamente.</p>';
  if (!state.client) return '<p class="muted">O serviço de contas e projetos ainda não foi configurado neste ambiente.</p>';
  if (!state.session) return '<p><a href="#conta">Entre na sua conta</a> para acessar seus projetos privados.</p><a href="#conta" data-action="create-account">Criar conta</a>';
  return '';
}

function overview() {
  const status = projectStatus();
  return heading('Visão geral', 'Explore o projeto em três dimensões e examine as decisões antes da obra.')
    + projectOverview() + '<div class="work-grid">' + studioEntry()
    + `<section class="panel"><h2>Projetos privados</h2>${guideActive() ? '<p>Abra a carteira para mostrar os projetos da sua conta.</p>' : status || projectList(state.projects.slice(0, 3))}
      <a href="#projetos">Gerenciar projetos →</a></section></div>`;
}

function account() {
  if (state.phase === 'identity-error') return heading('Conta','Confirme a conexão para recuperar seu perfil.')+projectStatus();
  if (state.phase === 'loading' && !state.session) return heading('Conta', 'Verificando sessão…');
  if (!state.client) return heading('Conta', serviceName(state)) + '<section class="panel"><h2>Acesso ao espaço privado</h2><p>Perfil, projetos e histórico ficam disponíveis com a integração de contas ativa. Você pode explorar a demonstração neste ambiente.</p><a class="button" href="#studio">Experimentar o Studio</a></section>';
  if (state.accountMode === 'recovery') {
    return heading('Redefinir senha', 'Defina a senha da sua conta a partir do link de recuperação.')
      + `<section class="panel">${recoveryUser && recoveryUser === state.session?.user.id ? `<form data-form="password">
          <label>Nova senha<input name="password" type="password" autocomplete="new-password" required></label><button>Salvar senha</button>
        </form>` : '<p>O link de recuperação está expirado, inválido ou precisa ser aberto no navegador que iniciou a solicitação.</p><a href="#conta" data-action="return-login">Voltar ao login</a>'}</section>`;
  }
  if (state.session) {
    return heading('Conta', 'Dados do seu perfil na SAFEVISION Platform.')
      + `<section class="panel"><div class="profile-ident"><span class="initial" aria-hidden="true">${escape((state.profile?.display_name || state.session.user.email || '').slice(0,1).toUpperCase())}</span><div><h2>Perfil</h2><p>${escape(state.session.user.email)}</p></div></div><p class="muted">${state.phase === 'ready' ? state.projects.length+' projetos privados' : 'Dados da conta indisponíveis'}</p>${state.phase==='error' ? button('Tentar novamente','retry','secondary') : ''}
      <form data-form="profile"><label>Nome de exibição<input name="display_name" maxlength="100" required value="${escape(state.profile?.display_name)}"></label>
      <div class="actions"><button ${state.phase !== 'ready' ? 'disabled' : ''}>Salvar perfil</button>${button('Sair','logout','secondary')}</div></form></section>`;
  }
  const mode = state.accountMode;
  const title = { login:'Entrar', signup:'Criar conta', reset:'Recuperar senha' }[mode];
  return heading(title, 'Use seu e-mail para acessar a área de projetos.') + `<section class="panel">
    <form data-form="${mode}">
      <label for="auth-email">E-mail</label><input id="auth-email" name="email" type="email" autocomplete="email" required>
      ${mode === 'reset' ? '' : `<label for="auth-password">Senha</label><div class="password-field"><input id="auth-password" name="password" type="password" autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}" required><button type="button" class="secondary" data-action="show-password" aria-controls="auth-password" aria-pressed="false">Mostrar</button></div>`}
      <div class="actions"><button>${title}</button>${mode !== 'login' ? button('Voltar ao login','login','secondary') : ''}</div>
    </form>
    ${mode === 'login' ? `<div class="actions" style="margin-top:14px">${button('Criar conta','signup','secondary')}${button('Esqueci a senha','reset','secondary')}</div>` : ''}
    </section>`;
}

function render() {
  const hash = location.hash.slice(1);
  if (hash === 'conteudo') return;
  const module = hash.split(/[/?]/)[0];
  const inspection = ['inspecoes', 'relatorios'].includes(module);
  const route = inspection || module === 'projetos' || module === 'explorar' ? module : routes.has(hash) ? hash : 'inicio';
  const key = inspection ? JSON.stringify([hash, state.session?.user.id]) : '';
  const currentUser = state.session?.user.id;
  const target = route === 'explorar' ? exploreRoute(hash) : null;
  const draft = disposeInspection?.pending() || temporary;
  if (draft && draft.userId === currentUser && displayedHash !== hash) {
    if (hash === draft.route || target?.origin === draft.route) temporary = draft;
    else if (!confirm('Sair e descartar as alterações ainda não salvas nesta ficha?')) {
      history.replaceState(null,'','#'+displayedHash);
      return;
    } else temporary = undefined;
  }
  if (temporary && temporary.userId !== currentUser) temporary = undefined;
  displayedHash = hash;
  if (inspectionKey !== key) { disposeInspection?.dispose(); disposeInspection = undefined; inspectionKey = key; }
  guideChrome(route);
  for (const link of document.querySelectorAll('nav a')) {
    if (link.hash === '#' + route) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  document.querySelector('#account-link').textContent = guideActive() ? 'Conta' : state.profile?.display_name || state.session?.user.email || 'Entrar';
  document.querySelector('#breadcrumb').textContent = document.querySelector('nav [aria-current]')?.textContent || '';
  const reuseStudio = target?.origin === 'studio' && target.valid && closeStudio?.prepared;
  const nextKey = target && !reuseStudio ? JSON.stringify([target.origin,target.valid,Boolean(target.code)]) : '';
  if (explorerKey !== nextKey) { explorer?.dispose(); explorer = undefined; explorerKey = nextKey; }
  if (reuseStudio) {
    if (studioRoute !== hash) closeStudio.open(target.code);
    studioRoute = hash;
    return;
  }
  if (route === 'studio') {
    if (studioRoute) closeStudio?.back();
    studioRoute = '';
    if (!closeStudio) closeStudio = mountStudio(screen);
    return;
  }
  studioRoute = '';
  closeStudio?.dispose();
  closeStudio = undefined;
  if (target) {
    if (!explorer) explorer = mountExploration(screen,target);
    else explorer.update(target);
    return;
  }
  if (route === 'apresentacao') { showPresentation(screen); return; }
  if (inspection) {
    if (!disposeInspection) {
      disposeInspection = mountInspection(screen, hash, currentUser, state.client, state.inspectionConfig, temporary);
      temporary = undefined;
    }
    return;
  }
  if (route === 'inicio') screen.innerHTML = overview();
  if (route === 'projetos') {
    const status = projectStatus();
    if (hash === 'projetos') screen.innerHTML = projectsPage(state,status,filters);
    else {
      const project = privateRoute.test(hash) && state.projects.find(item => item.id === hash.slice(9));
      screen.innerHTML = projectDetail(project,status);
      if (project && !status) {
        historyView = { node:screen.querySelector('#project-history'), id:project.id, rows:[], more:true };
        loadHistory(historyView);
      }
    }
  }
  if (route === 'conta') screen.innerHTML = '<div class="account-layout accounts-v2"><div>' + account() + '</div><aside class="account-art"><img src="./clinica/assets/recepcao.png" alt="Recepção da Clínica ÁUREA"><a href="#aurea">Explorar a Clínica ÁUREA →</a></aside></div>';
  if (route === 'aurea') screen.innerHTML = clinicPage();
  if (route === 'configuracoes') screen.innerHTML = heading('Configurações', 'Consulte os recursos e as condições desta execução.') + settingsPage(state);
}

function unwrap(result) {
  if (result.error) throw result.error;
  return result.data;
}

async function loadWorkspace() {
  const user = state.session?.user.id;
  if (!user) return;
  const request = ++workspaceRead;
  state.phase = 'loading';
  const renderWorkspace = () => {
    if (state.accountMode !== 'recovery' || location.hash !== '#conta') render();
  };
  renderWorkspace();
  try {
    const [projects, profile] = await Promise.all([
      state.data.projects(), state.data.profile()
    ]);
    if (state.session?.user.id !== user || request !== workspaceRead) return;
    state.projects = projects;
    state.profile = profile;
    state.phase = 'ready';
  } catch {
    if (state.session?.user.id !== user || request !== workspaceRead) return;
    state.projects = [];
    state.profile = null;
    state.phase = 'error';
  }
  renderWorkspace();
}

// Auth events are synchronous SDK callbacks. Verify restored identity outside the SDK lock.
function receiveSession(event, session) {
  const ticket = ++verification;
  if (!session) {
    pendingRecovery = undefined;
    sessionChanged(event, null);
    return;
  }
  if (event === 'PASSWORD_RECOVERY') pendingRecovery = session.user.id;
  if (state.session?.user.id === session.user.id && event !== 'INITIAL_SESSION') {
    sessionChanged(event, {...session, user:state.session.user});
    return;
  }
  sessionChanged('INITIAL_SESSION', null);
  state.phase = 'loading';
  render();
  setTimeout(async () => {
    try {
      const {data,error} = await state.client.auth.getUser(session.access_token);
      if (ticket !== verification) return;
      if (error || !data.user || data.user.id !== session.user.id) throw Error('Sessão indisponível');
      const kind = pendingRecovery === data.user.id ? 'PASSWORD_RECOVERY' : event;
      pendingRecovery = undefined;
      sessionChanged(kind,{...session,user:data.user});
    } catch {
      if (ticket !== verification) return;
      state.phase = 'identity-error';
      render();
    }
  },0);
}

function sessionChanged(event, session) {
  const changed = state.session?.user.id !== session?.user.id;
  if (changed || !session) recoveryUser = undefined;
  state.session = session;
  if (event === 'SIGNED_OUT') { destination = 'inicio'; state.accountMode = 'login'; }

  if (event === 'PASSWORD_RECOVERY') {
    recoveryUser = session?.user.id;
    state.accountMode = 'recovery';
    location.hash = 'conta';
  }
  if (changed || event === 'INITIAL_SESSION') {
    sessionController?.abort();
    sessionController = new AbortController();
    state.data = session ? projectData(state.config, state.client.auth,session.user.id,sessionController.signal) : null;
    filters.search = '';
    historyView = undefined;
    clearTimeout(messageTimer);
    feedback.hidden = true;
    if (dialog.open) dialog.close();
    dialog.replaceChildren();
    state.projects = [];
    state.profile = null;
    state.phase = session ? 'loading' : 'ready';
    render();
    if (session) setTimeout(loadWorkspace, 0);
  } else if (event === 'PASSWORD_RECOVERY') render();
}

function recoveryReturn() {
  const url = new URL(location.href);
  for (const field of ['recuperar', 'code', 'error', 'error_code', 'error_description']) {
    url.searchParams.delete(field);
  }
  url.hash = 'conta';
  history.replaceState(null, '', url);
  recoveryUser = undefined;
  state.accountMode = 'login';
  render();
}

function projectForm(project) {
  dialog.innerHTML = `<h2 id="dialog-title">${project ? 'Editar projeto' : 'Novo projeto'}</h2>
    <form data-form="project" data-revision="${escape(project?.updated_at)}" data-id="${escape(project?.id)}">
      <label>Nome do projeto (obrigatório)<input name="title" maxlength="120" required value="${escape(project?.title)}"></label>
      <label>Descrição<textarea name="description" maxlength="2000">${escape(project?.description)}</textarea></label>
      <p class="muted" data-dialog-status role="status"></p>
      <div class="actions"><button>${project ? 'Salvar alterações' : 'Criar projeto'}</button>${button('Cancelar','close','secondary')}</div>
    </form>`;
  if (!dialog.open) dialog.showModal();
  dialog.querySelector('input').focus();
}

async function loadHistory(view) {
  if (!view?.node.isConnected || view.pending) return;
  view.pending = true;
  try {
    const page = await state.data.history(view.id,view.rows.length);
    if (!view.node.isConnected) return;
    view.rows.push(...page);
    view.node.innerHTML = versionList(view.rows) + (page.length === 20 ? button('Ver mais versões','history','secondary') : '');
  } catch {
    if (view.node.isConnected) view.node.innerHTML = (view.rows.length ? versionList(view.rows) : '') + '<p>Falha ao carregar o histórico.</p>'+button('Tentar novamente','history','secondary');
  } finally { view.pending = false; }
}

function confirmation(project) {
  dialog.innerHTML = `<h2 id="dialog-title">Excluir projeto?</h2>
    <p>O registro <strong>${escape(project.title)}</strong> e seu histórico serão excluídos.</p>
    <form data-form="delete" data-revision="${escape(project.updated_at)}" data-id="${escape(project.id)}">
      <p class="muted" data-dialog-status role="status"></p>
      <div class="actions">${button('Cancelar','close','secondary')}<button class="danger">Excluir projeto</button></div>
    </form>`;
  if (!dialog.open) dialog.showModal();
  dialog.querySelector('[data-action="close"]').focus();
}

document.body.addEventListener('click', async event => {
  const control = event.target.closest('[data-action]');
  if (event.target.closest('a[href="#conta"]')) destination = privateRoute.test(location.hash.slice(1)) ? location.hash.slice(1) : 'inicio';
  if (!control) return;
  const action = control.dataset.action;
  if (action === 'create-account') { state.accountMode = 'signup'; return; }
  if (action === 'show-password') {
    const input = document.getElementById('auth-password');
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    control.textContent = show ? 'Ocultar' : 'Mostrar';
    control.setAttribute('aria-pressed',String(show));
    return;
  }
  if (action === 'verify') { location.reload(); return; }
  if (action === 'close') return dialog.close();
  if (action === 'return-login') return recoveryReturn();
  if (['login', 'signup', 'reset'].includes(action)) {
    state.accountMode = action;
    render();
    return screen.querySelector('input')?.focus();
  }
  if (action === 'logout') {
    if ((disposeInspection?.pending() || temporary) && !confirm('Encerrar a sessão e descartar a edição não salva?')) return;
    control.disabled = true;
    try {
      unwrap(await state.client.auth.signOut({ scope: 'local' }));
      location.hash = 'inicio';
      notice('Sessão encerrada.');
    } catch {
      control.disabled = false;
      notice('Não foi possível sair. Tente novamente.', true);
    }
    return;
  }
  if (!state.session) return;
  if (action === 'view') {
    filters.view = control.dataset.view;
    render();
    screen.querySelector('[data-view="'+filters.view+'"]').focus();
    return;
  }
  if (action === 'clear-search') {
    filters.search = '';
    render();
    screen.querySelector('#project-search')?.focus();
    return;
  }
  if (action === 'history') return loadHistory(historyView);
  if (action === 'retry') return loadWorkspace();
  if (action === 'new') return projectForm();
  const project = state.projects.find(item => item.id === control.dataset.id);
  if (!project) return;
  if (action === 'details') { location.hash='projetos/'+project.id; return; }
  if (action === 'edit') return projectForm(project);
  if (action === 'confirm-delete') confirmation(project);
});

screen.addEventListener('input', event => {
  if (event.target.id !== 'project-search' && event.target.id !== 'project-sort') return;
  if (event.target.id === 'project-search') filters.search = event.target.value;
  else filters.sort = event.target.value;
  screen.querySelector('#project-results').innerHTML = projectResults(state.projects,filters);
});

const returnUrl = () => new URL('./', location.href);

async function submit(form, data) {
  const action = form.dataset.form;
  const auth = state.client.auth;
  const credentials = { email: data.get('email')?.trim(), password: data.get('password') };
  if (action === 'login') {
    unwrap(await auth.signInWithPassword(credentials));
    location.hash = destination;
    destination = 'inicio';
    return 'Sessão iniciada.';
  }
  if (action === 'signup') {
    const result = unwrap(await auth.signUp({ ...credentials, options: { emailRedirectTo: returnUrl().href } }));
    state.accountMode = 'login';
    if (result.session) location.hash = 'inicio';
    else render();
    return result.session ? 'Conta criada.' : 'Verifique seu e-mail para confirmar o cadastro.';
  }
  if (action === 'reset') {
    const url = returnUrl();
    url.searchParams.set('recuperar', '1');
    unwrap(await auth.resetPasswordForEmail(credentials.email, { redirectTo: url.href }));
    return 'Se a conta existir, um link será enviado para o e-mail informado.';
  }
  if (!state.session) throw new Error('Sessão encerrada. Entre novamente.');
  if (action === 'password') {
    if (recoveryUser !== state.session.user.id) throw Error('Reabra o link de recuperação.');
    unwrap(await auth.updateUser({ password: credentials.password }));
    recoveryReturn();
    return 'Senha atualizada.';
  }
  if (action === 'profile') {
    const display_name = data.get('display_name').trim();
    if (!display_name) throw new Error('Informe o nome de exibição.');
    const service = state.data;
    await service.saveProfile(display_name,Boolean(state.profile));
    if (service !== state.data) return;
    await loadWorkspace();
    return 'Perfil atualizado.';
  }
  if (!['project', 'delete'].includes(action)) return;
  const service = state.data;
  const id = form.dataset.id;
  const original = id ? {id,updated_at:form.dataset.revision} : null;
  if (action === 'delete') await service.remove(original);
  else {
    const values = {title:data.get('title').trim(),description:data.get('description').trim()};
    if (!values.title) throw Error('Informe o nome do projeto.');
    await service.save(original,values);
  }
  if (service !== state.data) return;
  if (!form.isConnected) { await loadWorkspace(); return; }
  if (action === 'delete') location.hash = 'projetos';
  dialog.close();
  await loadWorkspace();
  return action === 'delete' ? 'Projeto excluído.' : 'Projeto salvo.';
}

document.body.addEventListener('submit', async event => {
  const form = event.target;
  if (!form.matches('[data-form]')) return;
  event.preventDefault();
  const control = form.querySelector('button:not([type=button])');
  if (!state.client || control.disabled) return;
  control.disabled = true;
  const owner = state.session?.user.id;
  const originalLabel = control.textContent;
  control.textContent = 'Aguarde…';
  form.setAttribute('aria-busy', 'true');
  try {
    const result = await submit(form, new FormData(form));
    if (result && (!owner || owner === state.session?.user.id)) notice(result);
  } catch (error) {
    if (!form.isConnected) return;
    const message = (error.code === 'invalid_credentials' || error.message === 'Invalid login credentials') ? 'E-mail ou senha incorretos.' :
      error.code === 'PGRST116' ? 'O registro mudou ou está indisponível. Copie seu texto e recarregue antes de tentar novamente.' :
      error.message?.startsWith('Informe ') ? error.message :
      ['project','delete'].includes(form.dataset.form) ?
        'Não foi possível confirmar a operação. Consulte seus projetos antes de repetir o salvamento.' :
        error.status === 429 ? 'Muitas tentativas. Aguarde antes de tentar novamente.' :
        'Não foi possível concluir. Confira os dados e a conexão e tente novamente.';
    const status = form.querySelector('[data-dialog-status]');
    if (status) status.textContent = message;
    else notice(message, true);
  } finally {
    control.disabled = false;
    control.textContent = originalLabel;
    form.removeAttribute('aria-busy');
    for (const input of form.querySelectorAll('[type=password]')) input.value = '';
  }
});

addEventListener('beforeunload', event => {
  if (disposeInspection?.pending() || temporary) { event.preventDefault(); event.returnValue = ''; }
});
addEventListener('hashchange', () => {
  if (dialog.open) dialog.close();
  if (location.hash !== '#conteudo') render();
});

try {
  const response = await fetch('./config.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Configuração indisponível.');
  const config = await response.json();
  if (config.url && config.key) {
    state.config = config;
    if (config.inspectionSync === true && ['127.0.0.1','localhost'].includes(new URL(config.url).hostname)) state.inspectionConfig = config;
    state.client = window.supabase.createClient(config.url, config.key, {
      auth: { flowType: 'pkce', storageKey: 'safevision-platform-v1' }
    });
    state.client.auth.onAuthStateChange(receiveSession);
  } else {
    state.phase = 'ready';
    render();
  }
} catch {
  state.phase = 'config-error';
  render();
  notice('Não foi possível inicializar a conexão com o serviço de contas.', true);
}

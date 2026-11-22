import { mountInspection } from './inspection.js';
import { projectOverview, studioEntry, clinicPage, settingsPage, navigation, serviceName } from './workspace.js';
navigation();
import { mountStudio } from './studio/studio.js';

const screen = document.querySelector('#screen');
const dialog = document.querySelector('#dialog');
const feedback = document.querySelector('#feedback');
const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' });
const routes = new Set(['inicio', 'projetos', 'studio', 'aurea', 'conta', 'configuracoes']);
const state = {
  client: null, session: null, phase: 'loading', projects: [], profile: null,
  accountMode: new URLSearchParams(location.search).has('recuperar') ? 'recovery' : 'login'
};
let messageTimer;
let closeStudio;
let inspectionKey = '';
let disposeInspection;

// The SDK only emits PASSWORD_RECOVERY after a successful PKCE exchange.
// Open the recovery screen even if there is no verifier in this browser.
if (state.accountMode === 'recovery') {
  const url = new URL(location.href);
  url.hash = 'conta';
  history.replaceState(null, '', url);
}

function escape(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
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
  if (state.phase === 'error') return `<p>Não foi possível carregar seus dados.</p>${button('Tentar novamente','retry')}`;
  if (state.phase === 'config-error') return '<p role="alert">Falha ao iniciar a conexão. Recarregue a página para tentar novamente.</p>';
  if (!state.client) return '<p class="muted">O serviço de contas e projetos ainda não foi configurado neste ambiente.</p>';
  if (!state.session) return '<p><a href="#conta">Entre na sua conta</a> para acessar seus projetos privados.</p>';
  return '';
}

function overview() {
  const status = projectStatus();
  return heading('Visão geral', 'Explore o projeto em três dimensões e examine as decisões antes da obra.')
    + projectOverview() + '<div class="work-grid">' + studioEntry()
    + `<section class="panel"><h2>Projetos privados</h2>${status || projectList(state.projects.slice(0, 3))}
      <a href="#projetos">Gerenciar projetos →</a></section></div>`;
}

function projectsPage() {
  const status = projectStatus();
  return heading('Meus projetos', 'Consulte e gerencie os metadados dos seus projetos privados.')
    + `<section class="panel"><div class="heading-row"><h2>Projetos</h2>${status ? '' : button('Novo projeto','new')}</div>${status || projectList(state.projects)}</section>
    <aside class="project-demo"><img src="./media/aurea.webp" alt=""><div><small>Demonstração disponível</small><h2>Clínica ÁUREA</h2><p>Consulte a modelagem de referência e as cinco fichas de inspeção.</p><a href="#aurea">Conhecer o projeto →</a></div></aside>`;
}

function account() {
  if (!state.client) return heading('Conta', serviceName(state)) + '<section class="panel"><h2>Acesso ao espaço privado</h2><p>Perfil, projetos e histórico ficam disponíveis com a integração de contas ativa. Você pode explorar a demonstração neste ambiente.</p><a class="button" href="#studio">Experimentar o Studio</a></section>';
  if (state.accountMode === 'recovery') {
    return heading('Redefinir senha', 'Defina a senha da sua conta a partir do link de recuperação.')
      + `<section class="panel">${state.session ? `<form data-form="password">
          <label>Nova senha<input name="password" type="password" minlength="8" autocomplete="new-password" required></label><button>Salvar senha</button>
        </form>` : '<p>O link de recuperação está expirado, inválido ou precisa ser aberto no navegador que iniciou a solicitação.</p><a href="#conta" data-action="return-login">Voltar ao login</a>'}</section>`;
  }
  if (state.session) {
    return heading('Conta', 'Dados do seu perfil na SAFEVISION Platform.')
      + `<section class="panel"><h2>Perfil</h2><p>${escape(state.session.user.email)}</p>
      <form data-form="profile"><label>Nome de exibição<input name="display_name" maxlength="100" required value="${escape(state.profile?.display_name)}"></label>
      <div class="actions"><button ${state.phase === 'loading' ? 'disabled' : ''}>Salvar perfil</button>${button('Sair','logout','secondary')}</div></form></section>`;
  }
  const mode = state.accountMode;
  const title = { login:'Entrar', signup:'Criar conta', reset:'Recuperar senha' }[mode];
  return heading(title, 'Use seu e-mail para acessar a área de projetos.') + `<section class="panel">
    <form data-form="${mode}">
      <label>E-mail<input name="email" type="email" autocomplete="email" required></label>
      ${mode === 'reset' ? '' : `<label>Senha<input name="password" type="password" ${mode === 'signup' ? 'minlength="8"' : ''} autocomplete="${mode === 'signup' ? 'new-password' : 'current-password'}" required></label>`}
      <div class="actions"><button>${title}</button>${mode !== 'login' ? button('Voltar ao login','login','secondary') : ''}</div>
    </form>
    ${mode === 'login' ? `<div class="actions" style="margin-top:14px">${button('Criar conta','signup','secondary')}${button('Esqueci a senha','reset','secondary')}</div>` : ''}
    </section>`;
}

function render() {
  const hash = location.hash.slice(1);
  const module = hash.split('/')[0];
  const inspection = ['inspecoes', 'relatorios'].includes(module);
  const route = inspection ? module : routes.has(hash) ? hash : 'inicio';
  const key = inspection ? JSON.stringify([hash, state.session?.user.id]) : '';
  if (inspectionKey !== key) { disposeInspection?.(); disposeInspection = undefined; inspectionKey = key; }
  for (const link of document.querySelectorAll('nav a')) {
    if (link.hash === '#' + route) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  document.querySelector('#account-link').textContent = state.session?.user.email || 'Entrar';
  document.querySelector('#breadcrumb').textContent = document.querySelector('nav [aria-current]')?.textContent || '';
  if (route === 'studio') {
    if (!closeStudio) closeStudio = mountStudio(screen);
    return;
  }
  closeStudio?.();
  closeStudio = undefined;
  if (inspection) {
    if (!disposeInspection) disposeInspection = mountInspection(screen, hash, state.session?.user.id, state.client, state.inspectionConfig);
    return;
  }
  if (route === 'inicio') screen.innerHTML = overview();
  if (route === 'projetos') screen.innerHTML = projectsPage();
  if (route === 'conta') screen.innerHTML = '<div class="account-layout"><div>' + account() + '</div><aside class="account-art"><img src="./media/r01.webp" alt="Detalhe de circulação da Clínica ÁUREA"><a href="./clinica/#inspection/R01">R01 · Circulação ↗</a></aside></div>';
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
  state.phase = 'loading';
  const renderWorkspace = () => {
    if (state.accountMode !== 'recovery' || location.hash !== '#conta') render();
  };
  renderWorkspace();
  try {
    const [projects, profile] = await Promise.all([
      state.client.from('projects').select('id,title,description,updated_at').order('updated_at', { ascending: false }).order('id'),
      state.client.from('profiles').select('display_name').maybeSingle()
    ]);
    if (state.session?.user.id !== user) return;
    state.projects = unwrap(projects);
    state.profile = unwrap(profile);
    state.phase = 'ready';
  } catch {
    if (state.session?.user.id !== user) return;
    state.projects = [];
    state.profile = null;
    state.phase = 'error';
  }
  renderWorkspace();
}

function sessionChanged(event, session) {
  const changed = state.session?.user.id !== session?.user.id;
  state.session = session;
  if (event === 'PASSWORD_RECOVERY') {
    state.accountMode = 'recovery';
    location.hash = 'conta';
  }
  if (changed || event === 'INITIAL_SESSION') {
    if (dialog.open) dialog.close();
    dialog.replaceChildren();
    state.projects = [];
    state.profile = null;
    state.phase = session ? 'loading' : 'ready';
    render();
    if (session) setTimeout(loadWorkspace, 0);
  }
}

function recoveryReturn() {
  const url = new URL(location.href);
  for (const field of ['recuperar', 'code', 'error', 'error_code', 'error_description']) {
    url.searchParams.delete(field);
  }
  url.hash = 'conta';
  history.replaceState(null, '', url);
  state.accountMode = 'login';
  render();
}

function projectForm(project) {
  dialog.innerHTML = `<h2 id="dialog-title">${project ? 'Editar projeto' : 'Novo projeto'}</h2>
    <form data-form="project" data-id="${escape(project?.id)}">
      <label>Título<input name="title" maxlength="120" required value="${escape(project?.title)}"></label>
      <label>Descrição<textarea name="description" maxlength="2000">${escape(project?.description)}</textarea></label>
      <p class="muted" data-dialog-status role="status"></p>
      <div class="actions"><button>Salvar projeto</button>${button('Cancelar','close','secondary')}</div>
    </form>`;
  if (!dialog.open) dialog.showModal();
  dialog.querySelector('input').focus();
}

async function details(project) {
  dialog.innerHTML = `<h2 id="dialog-title">${escape(project.title)}</h2>
    <p class="description">${escape(project.description || 'Sem descrição.')}</p>
    <div class="actions">
      <button type="button" data-action="edit" data-id="${escape(project.id)}">Editar</button>
      <button type="button" data-action="confirm-delete" data-id="${escape(project.id)}" class="danger">Excluir</button>
      ${button('Fechar','close','secondary')}
    </div><h3 style="margin-top:16px">Histórico</h3><div id="project-history" role="status">Carregando histórico…</div>`;
  dialog.showModal();
  const history = dialog.querySelector('#project-history');
  try {
    const versions = unwrap(await state.client.from('project_versions')
      .select('title,description,recorded_at').eq('project_id', project.id).order('recorded_at', { ascending: false }).limit(20));
    history.innerHTML = versions.length ? `<ul class="history">${versions.map(version => `<li>
      <strong>${escape(version.title)}</strong><small>${dateFormat.format(new Date(version.recorded_at))}</small>
      <p>${escape(version.description || 'Sem descrição.')}</p></li>`).join('')}</ul>` : '<p>Sem versões registradas.</p>';
  } catch {
    history.textContent = 'Não foi possível carregar o histórico.';
  }
}

function confirmation(project) {
  dialog.innerHTML = `<h2 id="dialog-title">Excluir projeto?</h2>
    <p>O registro <strong>${escape(project.title)}</strong> e seu histórico serão excluídos.</p>
    <form data-form="delete" data-id="${escape(project.id)}">
      <p class="muted" data-dialog-status role="status"></p>
      <div class="actions">${button('Cancelar','close','secondary')}<button class="danger">Excluir projeto</button></div>
    </form>`;
  dialog.querySelector('[data-action="close"]').focus();
}

document.body.addEventListener('click', async event => {
  const control = event.target.closest('[data-action]');
  if (!control) return;
  const action = control.dataset.action;
  if (action === 'close') return dialog.close();
  if (action === 'return-login') return recoveryReturn();
  if (['login', 'signup', 'reset'].includes(action)) {
    state.accountMode = action;
    render();
    return screen.querySelector('input')?.focus();
  }
  if (!state.session) return;
  if (action === 'retry') return loadWorkspace();
  if (action === 'logout') {
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
  if (action === 'new') return projectForm();
  const project = state.projects.find(item => item.id === control.dataset.id);
  if (!project) return;
  if (action === 'details') return details(project);
  if (action === 'edit') return projectForm(project);
  if (action === 'confirm-delete') confirmation(project);
});

const returnUrl = () => new URL('./', location.href);

async function submit(form, data) {
  const action = form.dataset.form;
  const auth = state.client.auth;
  const credentials = { email: data.get('email')?.trim(), password: data.get('password') };
  if (action === 'login') {
    unwrap(await auth.signInWithPassword(credentials));
    location.hash = 'inicio';
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
    unwrap(await auth.updateUser({ password: credentials.password }));
    recoveryReturn();
    return 'Senha atualizada.';
  }
  if (action === 'profile') {
    const display_name = data.get('display_name').trim();
    if (!display_name) throw new Error('Informe o nome de exibição.');
    const table = state.client.from('profiles');
    const request = state.profile
      ? table.update({ display_name }).eq('id', state.session.user.id)
      : table.insert({ display_name });
    unwrap(await request.select('display_name').single());
    await loadWorkspace();
    return 'Perfil atualizado.';
  }
  if (!['project', 'delete'].includes(action)) return;
  const table = state.client.from('projects');
  const id = form.dataset.id;
  if (action === 'delete') {
    unwrap(await table.delete().eq('id', id).select('id').single());
  } else {
    const values = { title: data.get('title').trim(), description: data.get('description').trim() };
    if (!values.title) throw new Error('Informe o título do projeto.');
    const request = id ? table.update(values).eq('id', id) : table.insert(values);
    unwrap(await request.select('id').single());
  }
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
  const originalLabel = control.textContent;
  control.textContent = 'Aguarde…';
  form.setAttribute('aria-busy', 'true');
  try {
    const result = await submit(form, new FormData(form));
    if (result) notice(result);
  } catch (error) {
    const message = error.message || 'Não foi possível concluir a operação.';
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

addEventListener('hashchange', () => {
  if (location.hash !== '#conteudo') render();
});

try {
  const response = await fetch('./config.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Configuração indisponível.');
  const config = await response.json();
  if (config.url && config.key) {
    if (config.inspectionSync === true && ['127.0.0.1','localhost'].includes(new URL(config.url).hostname)) state.inspectionConfig = config;
    state.client = window.supabase.createClient(config.url, config.key, {
      auth: { flowType: 'pkce', storageKey: 'safevision-platform-v1' }
    });
    state.client.auth.onAuthStateChange(sessionChanged);
  } else {
    state.phase = 'ready';
    render();
  }
} catch {
  state.phase = 'config-error';
  render();
  notice('Não foi possível inicializar a conexão com o serviço de contas.', true);
}

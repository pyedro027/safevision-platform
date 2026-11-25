import { exploreLink } from './exploration.js';
const cases = [
  ['Circulação', 'Largura de passagem no corredor e no marco da porta P10.'],
  ['Rota de saída', 'Duas portas sucessivas e seus eixos deslocados no vestíbulo.'],
  ['Acessibilidade', 'Posição do lavatório em relação à área de transferência no sanitário.'],
  ['Janela e pilar', 'Encontro entre a esquadria J01 e o elemento estrutural.'],
  ['Tubulação e viga', 'Interferência entre o ramal hidráulico e a estrutura.'],
];

export const projectFacts = '<dl class="facts"><div><dt>Modelo</dt><dd>V03</dd></div><div><dt>Setores</dt><dd>21</dd></div><div><dt>Casos documentados</dt><dd>05</dd></div></dl>';

export function studioEntry() {
  return `<article class="studio-entry"><div><small>Preparação de modelos</small><h2>SAFEVISION Studio</h2><p>Identifique as pranchas oficiais ou prepare a demonstração diretamente.</p><a href="#studio">Experimentar o Studio →</a></div><img src="./media/r01.webp" alt="Detalhe cotado da circulação"></article>`;
}

export function projectOverview() {
  return `<article class="feature"><div><small>Projeto demonstrativo · Vila Velha, ES</small><h2>Clínica ÁUREA</h2><p>Odontologia e estética. Explore a arquitetura e compare cinco condições documentadas antes da obra.</p><div class="actions"><a class="button" href="${exploreLink('inicio')}">Abrir demonstração 3D</a><a href="#inspecoes">Inspecionar casos →</a><a href="#apresentacao">Apresentar a plataforma →</a></div></div><img src="./media/aurea.webp" alt="Vista externa do modelo da Clínica ÁUREA"></article>${projectFacts}`;
}

export function clinicPage() {
  return `<header class="clinic-cover"><img src="./clinica/assets/recepcao.png" alt="Recepção da Clínica ÁUREA"><div><small>Vila Velha · Espírito Santo</small><h1>Clínica ÁUREA</h1><p>Projeto de odontologia e estética</p></div></header>${projectFacts}
    <div class="actions clinic-actions"><a class="button" href="${exploreLink('aurea')}">Explorar a clínica em 3D</a><a href="#inspecoes">Registrar inspeção</a><a href="#studio">Preparar no Studio →</a></div>
    <h2>Casos disponíveis</h2><div class="case-grid">${cases.map(([name, description], i) => `<a class="case" href="${exploreLink('aurea','R0'+(i+1))}"><img src="./media/r0${i+1}.webp" alt=""><div><small>R0${i+1} · Ficha de inspeção</small><h3>${name}</h3><p>${description}</p></div></a>`).join('')}</div>`;
}

export function serviceName(state) {
  if (state.phase === 'error') return 'Falha ao consultar os dados';
  if (state.phase === 'config-error') return 'Falha ao iniciar a conexão';
  if (!state.client) return 'Contas indisponíveis nesta execução';
  return state.session ? 'Sessão autenticada' : 'Integração configurada · visitante';
}

export function settingsPage(state) {
  const sections = [
    ['Plataforma', [['Versão', 'SAFEVISION Platform V1'], ['Ambiente atual', location.hostname]]],
    ['Visualização tridimensional', [['Motor', 'Babylon.js'], ['Modelo', 'Clínica ÁUREA · V03'], ['Inspeção', 'Cinco casos com problema e proposta']]],
    ['Contas e projetos', [['Estado', serviceName(state)], ['Acesso privado', 'Perfil, projetos e histórico por conta']]],
    ['Recursos experimentais', [['Studio', 'Preparação demonstrativa com dois PDFs oficiais'], ['Conversão de plantas externas', 'Indisponível'], ['WebXR', 'Implementado · validação física no Quest 2 pendente']]],
  ];
  return '<div class="settings-grid">'+sections.map(([title, rows])=>`<section class="panel"><h2>${title}</h2><dl class="specs">${rows.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl></section>`).join('')+'</div>';
}

export function navigation() {
  const menu = document.querySelector('#navigation');
  const toggle = document.querySelector('#menu-toggle');
  function close() { toggle.setAttribute('aria-expanded','false'); }
  toggle.onclick = () => toggle.setAttribute('aria-expanded', String(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', event => { if (event.target.closest('a')) { close(); if (toggle.offsetWidth) toggle.focus(); } });
  addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { close(); toggle.focus(); }
  });
  addEventListener('hashchange', close);
}

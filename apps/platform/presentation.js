import { exploreLink } from './exploration.js';
import { codes } from './inspection-store.js';

const key = 'safevision:guide:v1';
const steps = [
  ['A proposta','Inspecionar antes de construir','Compare o que foi projetado com uma alternativa de correção. A decisão técnica permanece com quem avalia.','aurea.webp'],
  ['Plataforma','Um espaço de trabalho','A visão geral reúne projetos, Studio, inspeções e relatórios.','aurea.webp','Abrir visão geral','#inicio'],
  ['Contas e projetos','Do cadastro ao histórico','Abra a carteira apenas se quiser apresentar os projetos da conta atual. Também é possível seguir como visitante.','', 'Mostrar minha carteira','#projetos'],
  ['Clínica ÁUREA','O projeto de referência','Visite a clínica de odontologia e estética de Vila Velha. Os cinco casos pertencem à modelagem V03.','aurea.webp','Conhecer a clínica','#aurea'],
  ['Studio','Dos documentos ao ambiente','O Studio reconhece o par oficial de PDFs e prepara o modelo existente. Você também pode experimentar a clínica sem selecionar arquivos.','r01.webp','Abrir Studio','#studio'],
  ['Exploração','Percorra a clínica','Use os ambientes reais do modelo e consulte as decisões de projeto na própria cena.','recepcao','Explorar em 3D',exploreLink('apresentacao')],
  ['Casos','Compare problema e proposta','Escolha uma ficha para localizar o caso no modelo. Para uma apresentação curta, percorra R01, R03 e R05.','r05.webp'],
  ['Avaliação','Registre sua observação','Escolha uma ficha. O status, a observação e a recomendação são preenchidos pelo avaliador.','r03.webp','Abrir inspeções','#inspecoes'],
  ['Relatório','Do registro ao documento','Consulte a origem das avaliações e use a impressão A4 para gerar o relatório demonstrativo.','r04.webp','Abrir relatório','#relatorios'],
  ['Visão futura','Da demonstração ao produto','A edição atual reúne visualização, cadastro e avaliação humana. Conversão de projetos externos, colaboração e análise automatizada são objetivos futuros.','aurea.webp']
];
let current = 0;
try {
  const stored = Number(sessionStorage.getItem(key));
  if (Number.isInteger(stored) && stored >= 1 && stored <= steps.length + 1) current = stored;
} catch { /* Navigation can run entirely in memory. */ }

export const guideActive = () => current > 0;

export function guideChrome(route) {
  document.body.toggleAttribute('data-presenting', current > 0);
  document.querySelector('.return-guide').hidden = !current || route === 'apresentacao';
}

export function showPresentation(screen) {
  const intro = current === 0;
  const end = current === steps.length + 1;
  const [label,title,description,photo,action,dest] = steps[current-1] || [];
  const path = photo === 'recepcao' || intro || end ? './clinica/assets/recepcao.png' : './media/'+photo;
  const image = photo || intro || end ? '<img src="'+path+'" alt="Vista do projeto demonstrativo da Clínica ÁUREA">' : '';
  screen.innerHTML = `<section class="guide">
    <div class="guide-head"><span>SAFEVISION Platform V1</span><button class="secondary" data-guide="exit">Encerrar apresentação</button></div>
    <div class="guide-cover ${image ? '' : 'text-only'}"><div class="guide-copy">
    <small>${intro ? 'Demonstration Edition' : end ? 'Encerramento' : 'Etapa '+current+' de '+steps.length+' · '+label}</small>
    <h1 tabindex="-1">${intro ? 'Inspeção antes da obra' : end ? 'Apresentação concluída' : title}</h1>
    <p>${intro ? 'Explore as decisões de projeto da Clínica ÁUREA, compare cinco casos em 3D e registre uma avaliação técnica.' : end ? 'Os projetos e as avaliações continuam disponíveis na plataforma.' : description}</p>
    ${intro || end ? '<button data-guide="start">'+(intro?'Iniciar apresentação':'Reiniciar roteiro')+'</button>' : action ? '<a class="button" href="'+dest+'">'+action+' →</a>' : ''}
    ${current===7 ? '<div class="guide-cases">'+codes.map(c=>'<a href="'+exploreLink('apresentacao',c)+'">'+c+'</a>').join('')+'</div>' : ''}</div>${image}</div>
    ${!intro ? '<div class="guide-controls"><button class="secondary" data-guide="previous">Anterior</button>'+(end?'':'<button data-guide="next">'+(current===10?'Concluir roteiro':'Próxima etapa')+'</button>')+'</div>' : ''}
    </section>`;
  const root = screen.firstElementChild;
  root.onclick = event => {
    const cmd = event.target.closest('[data-guide]')?.dataset.guide;
    if (!cmd) return;
    if (cmd === 'exit') current=0;
    if (cmd === 'start') current=1;
    if (cmd === 'previous') current=Math.max(0,current-1);
    if (cmd === 'next') current=Math.min(steps.length+1,current+1);
    try { if(current) sessionStorage.setItem(key,String(current)); else sessionStorage.removeItem(key); } catch {}
    guideChrome('apresentacao');
    if (cmd === 'exit') location.hash='inicio';
    else {showPresentation(screen); screen.querySelector('h1').focus();}
  };
}

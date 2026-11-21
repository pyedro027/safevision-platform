import {RISK_NAMES} from './inspection.js';
const $=id=>document.getElementById(id);
const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;};
export class Interface {
 constructor(model,nav,inspection,quality){
  Object.assign(this,{model,nav,inspection,quality});this.inspected='R01';this.mode='entry';this.nearby=null;
  $('startButton').onclick=()=>this.explore();$('resumeButton').onclick=()=>this.explore();$('pauseButton').onclick=()=>this.pause();$('brandHome').onclick=e=>{e.preventDefault();this.pause()};
  $('homeButton').onclick=$('pauseHome').onclick=()=>this.home();$('roomsButton').onclick=$('pauseRooms').onclick=()=>this.openRooms();$('risksButton').onclick=$('pauseRisks').onclick=()=>this.openRisk(this.inspected);
  $('cleanButton').onclick=$('pauseClean').onclick=()=>{const show=!this.inspection.enabled;this.inspection.leave();this.setMarkers(show);this.explore();this.toast(show?'Identificação digital habilitada':'Arquitetura limpa · estados preservados · C para mostrar riscos');};
  for(const btn of document.querySelectorAll('.close-panel'))btn.onclick=()=>this.explore();
  $('exitButton').onclick=()=>{this.nav.pause();this.inspection.leave();this.hidePanels();this.mode='entry';$('entry').hidden=false;$('hud').hidden=true;$('bottom').hidden=true;this.inspection.container.hidden=true;};
  $('speed').oninput=e=>{this.nav.speed=+e.target.value;$('speedValue').textContent=this.nav.speed.toFixed(2).replace('.',',')+' m/s';};
  $('sensitivity').oninput=e=>{this.nav.sensitivity=Number(e.target.value)*.002;$('sensitivityValue').textContent=Number(e.target.value).toFixed(2)+'×';};
  $('invertY').onchange=e=>{this.nav.invertY=e.target.checked;};
  $('quality').onchange=e=>{const applied=quality(e.target.value);if(applied){e.target.value=applied;if(window.__tourDebug)window.__tourDebug.desktopProfile=applied;for(const select of document.querySelectorAll('[data-quality=desktop]'))select.value=applied;}};$('markersCheck').onchange=e=>this.setMarkers(e.target.checked);$('metricsCheck').onchange=e=>$('metrics').hidden=!e.target.checked;
  $('nearbyButton').onclick=()=>this.interact();$('doorButton').onclick=()=>this.useDoor();this.nav.onEscape=()=>{if(this.mode==='explore')this.pause()};
  addEventListener('keydown',e=>{if(e.repeat||e.target.matches?.('input,select,textarea'))return;if(e.code==='Escape'){if(this.mode==='explore')this.pause();else if(['rooms','inspection'].includes(this.mode))this.explore(false)}if(this.mode!=='explore')return;if(e.code==='KeyR'){e.preventDefault();this.openRisk(this.inspected)}if(e.code==='KeyE'){e.preventDefault();this.interact()}if(e.code==='KeyF'){e.preventDefault();this.useDoor()}if(e.code==='KeyC'){e.preventDefault();$('cleanButton').onclick()}if(e.code==='Tab'){e.preventDefault();if(this.nav.active){this.nav.pause();this.toast('Cursor livre · selecione uma ferramenta · Tab para voltar');}else this.nav.resume();}});
  for(const room of model.config.rooms){const button=node('button');button.dataset.room=room.id;button.append(node('b',room.id));const label=node('span',room.name);if(['A16','A17'].includes(room.id))label.append(node('small','Acesso pela área externa'));button.append(label);button.onclick=()=>this.visit(room.id);$('roomList').append(button);}
  for(const card of model.cards){const button=node('button',card.codigo);button.dataset.risk=card.codigo;button.title=RISK_NAMES[card.codigo];button.onclick=()=>this.openRisk(card.codigo,true);$('riskTabs').append(button);const quick=node('button',card.codigo+' · '+RISK_NAMES[card.codigo]);quick.title='Localizar e inspecionar '+card.codigo;quick.onclick=()=>this.openRisk(card.codigo,true);$('riskQuickList').append(quick);}
  this.setMarkers(true);
  $('startButton').disabled=false;$('loadMessage').textContent='Modelo pronto · carregamento local';$('progressFill').style.width='100%';
 }
 toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>$('toast').hidden=true,3800);}
 hidePanels(){for(const id of ['roomsPanel','riskPanel','pause','technicalLabel'])$(id).hidden=true;}
 setMarkers(value){this.inspection.setEnabled(value);$('markersCheck').checked=value;$('cleanButton').textContent=value?'Arquitetura limpa':'Mostrar riscos';$('cleanButton').setAttribute('aria-pressed',String(!value));$('riskQuickList').hidden=!value;}
 explore(lock=true){
  this.inspection.leave();this.hidePanels();$('entry').hidden=true;$('hud').hidden=false;$('bottom').hidden=false;this.inspection.container.hidden=!this.inspection.enabled;this.mode='explore';this.update();
  const p=this.nav.camera.position;if(!this.model.freePosition(p.x,-p.z,.23)){this.nav.teleport(this.model.safeSpawn(this.model.config.rooms.find(r=>r.id==='A01')));this.toast('Retorno à recepção: a nova configuração ocupa o ponto anterior.');}
  if(lock&&!this.nav.screenMode)this.nav.resume();else{this.nav.active=true;this.nav.keys.clear();this.nav.canvas.focus();this.nav.updateMouseHint();}
 }
 pause(){this.nav.pause();this.hidePanels();this.mode='pause';$('pause').hidden=false;}
 home(){this.inspection.leave();const room=this.model.config.rooms.find(r=>r.id==='A01');const pos=this.model.freePosition(1.9,5)?[1.9,5,1.65]:this.model.safeSpawn(room);this.nav.teleport(pos,[5,5,1.5]);this.explore();}
 visit(code){try{this.inspection.leave();const room=this.model.config.rooms.find(r=>r.id===code);const p=this.model.safeSpawn(room);this.nav.teleport(p,[p[0]+1,p[1],1.55]);this.explore();this.toast(room.name);}catch(e){this.toast(e.message)}}
 openRooms(){this.nav.pause();this.inspection.leave();this.hidePanels();this.mode='rooms';$('roomsPanel').hidden=false;}
 openRisk(code,locate=false){
  this.nav.pause();this.hidePanels();this.mode='inspection';this.inspected=code;this.setMarkers(true);$('riskPanel').hidden=false;
  if(this.inspection.selected&&this.inspection.selected!==code)this.inspection.leave();
  if(locate||code==='R05')this.inspection.locate(code);
  $('technicalLabel').hidden=!(this.inspection.selected==='R05');this.renderRisk();
 }
 renderRisk(){
  const card=this.model.cards.find(x=>x.codigo===this.inspected),state=this.model.states[this.inspected];
  for(const b of $('riskTabs').children)b.setAttribute('aria-selected',String(b.dataset.risk===this.inspected));
  const target=$('riskContent');target.replaceChildren();target.append(node('span',card.rotulo_situacao_normativa,'status-tag'),node('h3',card.nome_risco,'risk-name'),node('p',card.local,'local'));
  const actions=node('div',undefined,'two-buttons'),locate=node('button',card.codigo==='R05'?'Inspecionar R05':'Localizar no 3D ↗'),back=node('button','Voltar à navegação');locate.id='locateRisk';locate.onclick=()=>{this.inspection.locate(card.codigo);$('technicalLabel').hidden=card.codigo!=='R05';};back.onclick=()=>this.explore();actions.append(locate,back);target.append(actions);
  const compare=node('div',undefined,'compare');for(const [value,title,cls] of [['PROB','Com problema','problem'],['CORR','Proposta','proposal']]){const b=node('button',title,cls);b.dataset.state=value;b.setAttribute('aria-pressed',String(value===state));b.onclick=()=>{if(!this.inspection.selected)this.inspection.locate(card.codigo);this.model.resetDoors();this.model.setState(card.codigo,value);this.inspection.showAnalysis();$('technicalLabel').hidden=card.codigo!=='R05';this.renderRisk();};compare.append(b);}target.append(compare,node('p','Comparação conceitual. Mesmos materiais e iluminação nos dois estados.','proposal-note'));
  if(card.codigo==='R01'&&state==='CORR')target.append(node('p','Entre rodapés: 1,4865 m. Não corresponde a 1,50 m livres nem certifica conformidade.','status-tag'));
  $('riskPanel').classList.toggle('technical-panel',card.codigo==='R05');
  if(card.codigo==='R05')target.append(node('p',state==='PROB'?'A tubulação ocupa parte do volume da viga. O contorno laranja delimita a interseção documentada.':'O trecho de descida foi desviado na proposta existente. A folga representada ainda necessita validação dos projetistas.','technical-explanation'));
  const body=card.codigo==='R05'?node('details'):target;if(body!==target){body.append(node('summary','Ficha completa e referências'));target.append(body);}
  const section=(title,text)=>{const s=node('section',undefined,'card-section');s.append(node('h3',title));if(Array.isArray(text)){const ul=node('ul');for(const t of text)ul.append(node('li',t));s.append(ul);}else s.append(node('p',text));body.append(s);};
  section('Problema documentado',card.problema_identificado);section('Evidência geométrica',card.evidencias_geometricas||card.evidencia);section('Consequência potencial',card.consequencia_possivel);section('Proposta de revisão',card.sugestao_correcao);
  const details=(title)=>{const d=node('details');d.append(node('summary',title));body.append(d);return d;};
  const norms=details('Referências normativas e fontes');const list=node('ul',undefined,'norms');
  for(const ref of card.normas_e_itens_pertinentes||[]){const li=node('li');li.append(node('strong',`${ref.norma} · ${ref.edicao} · ${ref.item}`),node('p',ref.explicacao_objetiva));if(ref.url){const a=node('a','Consultar fonte','source-link');a.href=ref.url;a.target='_blank';a.rel='noopener noreferrer';li.append(a);}list.append(li);}norms.append(list);
  const limits=details('Limitações e verificações pendentes');limits.append(node('p',card.conclusao_individual||card.limitacoes));const pending=node('ul');for(const text of card.informacoes_ainda_necessarias||[])pending.append(node('li',text));limits.append(pending);
  const link=node('a','Abrir ficha documental completa ↗','source-link');link.href=`data/fichas/${card.codigo}.md`;link.target='_blank';link.rel='noopener';target.append(link,node('p','Caso previamente identificado e documentado. O protótipo não realiza detecção automática nem aprovação normativa.','fine'));
 }
 useDoor(){const door=this.model.nearestDoor(this.nav.camera.position);if(door)this.model.operateDoor(door,this.nav.camera.position,t=>this.toast(t));}
 interact(){this.update();if(this.nearby?.risk)this.openRisk(this.nearby.risk,true);else if(this.nearby?.door)this.model.operateDoor(this.nearby.door,this.nav.camera.position,t=>this.toast(t));}
 update(){
  const room=this.model.roomAt(this.nav.camera.position);$('roomName').textContent=this.model.technical?'R05 · entre-forro':room?`${room.id} · ${room.name}`:'Área externa';
  const proposed=Object.values(this.model.states).filter(x=>x==='CORR').length;$('stateLabel').textContent=this.mode==='inspection'?`${this.inspected} · ${this.model.states[this.inspected]==='CORR'?'Proposta de revisão':'Com problema'}`:proposed?`${proposed} proposta${proposed>1?'s':''} em visualização`:'Com problema · projeto original';
  const door=this.model.nearestDoor(this.nav.camera.position),risk=this.inspection.nearest();this.nearby=risk?{risk}:door?{door}:null;
  $('nearbyButton').hidden=this.mode!=='explore'||!this.nearby;if(this.nearby)$('nearbyButton').textContent=risk?`${risk} — ${RISK_NAMES[risk]} · ${this.model.states[risk]==='CORR'?'Proposta de revisão':'Com problema'} · E para inspecionar`:`E · ${door.target?'Fechar':'Abrir'} ${door.label}`;
  $('doorButton').hidden=this.mode!=='explore'||!door||!risk;if(door)$('doorButton').textContent=`F · ${door.target?'Fechar':'Abrir'} ${door.label}`;
  $('riskQuickList').hidden=!this.inspection.enabled||this.mode!=='explore';
 }
}

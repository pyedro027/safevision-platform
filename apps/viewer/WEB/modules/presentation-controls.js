import {standardPad} from './input-math.js';
import {XR_PROFILES,PROFILES} from './quality.js';
export class PresentationControls {
 constructor(app,quality){
  this.app=app;this.quality=quality;this.until=0;this.action=[0,0,0];this.armed=false;this.lastTrigger=false;this.padIndex=null;
  app.xrProfile='balanced';app.desktopProfile='balanced';
  const entry=document.createElement('fieldset');entry.className='presentation-entry';entry.innerHTML=`<legend>Apresentação · candidata C</legend><label><input id="screenMode" type="checkbox"> Controles na tela (sem teclado)</label><label>Qualidade 3D <select data-quality="desktop"></select></label><label>Qualidade VR <select data-quality="xr"></select></label><small>VR: escolha antes de preparar a sessão. Para mudar, saia e prepare novamente.</small>`;
  document.getElementById('startButton').before(entry);
  const dock=document.createElement('section');dock.id='screenControls';dock.hidden=true;dock.setAttribute('aria-label','Navegação sem teclado');
  dock.innerHTML=`<details><summary>Apresentação / qualidade</summary><label>3D <select data-quality="desktop"></select></label><label>VR <select data-quality="xr"></select></label><label><input id="useGamepad" type="checkbox"> Ativar gamepad padrão disponível</label><p id="padStatus">Sem mapeamento confirmado; use os botões.</p><small>Cada toque dá um passo curto. Parar cancela imediatamente.</small></details><div class="screen-directions"><button data-step="0,-1,0">Avançar</button><button data-step="0,1,0">Recuar</button><button data-step="-1,0,0">Lado esquerdo</button><button data-step="1,0,0">Lado direito</button><button data-step="0,0,-1">Girar esquerda</button><button data-step="0,0,1">Girar direita</button><button id="screenStop">Parar</button><button id="screenDoor">Porta próxima</button><button id="screenInteract">Inspecionar / interagir</button></div><output id="screenMotion" aria-live="polite">Parado</output>`;
  document.body.append(dock);this.dock=dock;
  const mode=document.getElementById('screenMode');mode.checked=matchMedia('(pointer:coarse)').matches;app.nav.screenMode=mode.checked;
  mode.onchange=()=>{app.nav.screenMode=mode.checked;this.stop();};
  for(const select of document.querySelectorAll('[data-quality]')){
   const xr=select.dataset.quality==='xr';for(const [id,p] of Object.entries(xr?XR_PROFILES:PROFILES)){const option=document.createElement('option');option.value=id;option.textContent=p.label;select.append(option);}select.value='balanced';
   select.onchange=()=>{if(app.xrActive||app.xrPreparing)return;const key=xr?'xrProfile':'desktopProfile';app[key]=select.value;for(const other of document.querySelectorAll(`[data-quality="${xr?'xr':'desktop'}"]`))other.value=select.value;if(!xr){quality(select.value);document.getElementById('quality').value=select.value;}else{app.invalidateXR?.();app.ui.toast('Qualidade VR selecionada: '+XR_PROFILES[select.value].label+'. Prepare novamente antes de entrar.');}};
  }
  this.xrSelects=[...document.querySelectorAll('[data-quality=xr]')];
  const tools=document.createElement('button');tools.textContent='Controles na tela';tools.onclick=()=>{app.nav.screenMode=!app.nav.screenMode;mode.checked=app.nav.screenMode;this.stop();app.ui.explore(false);};document.querySelector('#hud nav').append(tools);
  for(const button of dock.querySelectorAll('[data-step]'))button.onclick=()=>{if(app.ui.mode!=='explore'||app.xrActive)return;app.nav.active=true;this.action=button.dataset.step.split(',').map(Number);this.until=performance.now()+220;this.label('Passo ativo · Parar cancela');};
  document.getElementById('screenStop').onclick=()=>this.stop();
  document.getElementById('screenDoor').onclick=()=>{this.stop();app.ui.useDoor();};document.getElementById('screenInteract').onclick=()=>{this.stop();app.ui.interact();};
  document.getElementById('useGamepad').onchange=()=>this.stop();
  for(const event of ['blur','pagehide','gamepaddisconnected'])addEventListener(event,()=>this.stop());document.addEventListener('visibilitychange',()=>{if(document.hidden)this.stop();});
 }
 label(text){const el=document.getElementById('screenMotion');if(el.textContent!==text)el.textContent=text;}
 stop(){this.until=0;this.action=[0,0,0];this.armed=false;this.lastTrigger=false;this.app.nav.clearVirtualInput();this.label('Parado');}
 update(){
  const {app}=this;const enabled=!app.xrActive&&app.ui.mode==='explore'&&app.nav.active&&!document.hidden;
  this.dock.hidden=app.xrActive||app.ui.mode!=='explore'||!app.nav.screenMode;
  const busy=!!(app.xrActive||app.xrPreparing);if(busy!==this.lastXRBusy){for(const select of this.xrSelects)select.disabled=busy;this.lastXRBusy=busy;}
  if(!enabled){if(this.until||this.armed)this.stop();app.nav.setVirtualInput();return;}
  let input=[0,0,0],trigger=false;
  if(performance.now()<this.until)input=this.action;else if(this.until){this.until=0;app.nav.clearVirtualInput();this.label('Parado');}
  if(document.getElementById('useGamepad').checked){
   let pads=[];try{pads=Array.from(navigator.getGamepads?.()||[]);}catch{}const gp=pads.find(p=>standardPad(p)),value=standardPad(gp);
   const info=document.getElementById('padStatus');const text=gp?'Gamepad standard disponível · '+gp.id:'Controles não expostos com mapeamento reconhecido; use os botões.';if(info.textContent!==text)info.textContent=text;
   if(!value||this.padIndex!==gp.index){this.armed=false;this.lastTrigger=false;this.padIndex=gp?.index;app.nav.clearVirtualInput();}
   if(value){const neutral=Math.hypot(value.move.x,value.move.y,value.look.x)<.01&&!value.trigger;if(neutral)this.armed=true;
    if(this.armed){input=[value.move.x,value.move.y,value.look.x];trigger=value.trigger;}}
  }
  if(trigger&&!this.lastTrigger){this.stop();app.ui.interact();}this.lastTrigger=trigger;
  app.nav.setVirtualInput(...input);
 }
}

import {prepareXR} from './xr.js';
export function installBridge(app,quality){
 let vr=null,busy=false;app.invalidateXR=()=>{if(busy||app.xrActive)return;vr?.dispose();vr=null;const button=document.getElementById('enterVR');if(button)button.textContent='Entrar em VR · verificar suporte';};const send=(event,data={})=>parent.postMessage({channel:'safevision',event,...data},location.origin);
 addEventListener('message',async e=>{if(e.origin!==location.origin||e.source!==parent||e.data?.channel!=='safevision')return;const {action,settings,code}=e.data;try{
  if(action==='pause'){app.presentation?.stop();app.nav.pause();app.ui.pause();app.suspended=true;}
  if(action==='resume'){app.suspended=false;app.engine.resize();}
  if(action==='risk'&&app.model.cards.some(c=>c.codigo===code)){app.suspended=false;app.ui.explore(false);app.ui.openRisk(code,true);}
  if(action==='settings'){app.desktopProfile=['low','balanced','high'].includes(settings.quality)?settings.quality:'balanced';quality(app.desktopProfile);document.getElementById('quality').value=app.desktopProfile;for(const select of document.querySelectorAll('[data-quality=desktop]'))select.value=app.desktopProfile;app.nav.sensitivity=Math.max(.25,Math.min(2,Number(settings.sensitivity)||1))*.002;app.nav.invertY=!!settings.invertY;app.ui.setMarkers(!!settings.markers);}
  if(action==='vr'){app.suspended=false;send('vr-status',{text:'Use o botão Entrar em VR dentro do visualizador.'});document.getElementById('enterVR').hidden=false;}
 }catch(error){send('vr-status',{text:error.message})}});
 const b=document.createElement('button');b.id='enterVR';b.textContent='Entrar em VR · verificar suporte';b.style.cssText='position:fixed;right:22px;bottom:90px;z-index:100;padding:15px;background:#184c3d;color:white;border-radius:8px';b.hidden=true;document.body.append(b);
 // Preparation on first click; session entry on a second direct user activation.
 b.onclick=async()=>{if(busy)return;busy=true;app.xrPreparing=true;b.disabled=true;try{if(vr&&vr.profile!==(app.xrProfile||'balanced')){vr.dispose();vr=null;}if(!vr){vr=await prepareXR(app,quality,app.xrProfile||'balanced');b.textContent=vr?'Iniciar sessão VR':'VR não disponível · continuar no desktop';return;}await vr.enter();b.hidden=true;}catch(e){send('vr-status',{text:'Não foi possível iniciar VR: '+e.message});b.textContent='Tentar iniciar VR novamente';}finally{busy=false;app.xrPreparing=false;b.disabled=false;}};
 const home=document.createElement('button');home.textContent='← Painel SAFEVISION';home.style.cssText='position:fixed;left:20px;bottom:65px;z-index:100';home.onclick=()=>send('home');document.body.append(home);
 send('ready');
}

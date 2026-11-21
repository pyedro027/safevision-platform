// Spatial WebXR controls; no changes to the imported geometry.
import {world} from './model.js';
import {xrStick,boundedDt} from './input-math.js';
import {XR_PROFILES} from './quality.js';
export async function prepareXR(app,quality,profile='balanced'){
 const B=window.BABYLON,{scene,model,nav,ui,inspection}=app;
 const status=text=>parent.postMessage({channel:'safevision',event:'vr-status',text},location.origin);
 if(!isSecureContext||!navigator.xr||!await navigator.xr.isSessionSupported('immersive-vr').catch(()=>false)){status('VR indisponível neste navegador. Desktop permanece disponível.');return null;}
 const chosen=XR_PROFILES[profile]||XR_PROFILES.balanced;
 const xr=await scene.createDefaultXRExperienceAsync({disableDefaultUI:true,disableTeleportation:true,disablePointerSelection:true,inputOptions:{doNotLoadControllerMeshes:true},outputCanvasOptions:{canvasOptions:{antialias:true,depth:true,stencil:true,alpha:false,framebufferScaleFactor:chosen.scale}}});
 const observers=[];const observe=(observable,fn)=>{const token=observable.add(fn);observers.push([observable,token]);return token;};
 let sessionAbort=null,panelDistance=1.25,walk=false,motionArmed=false,turnReady=true,headTracked=false;
 let panel,texture,material,buttons=[],selected='R01',page=0,textPage=0,textPages=1,roomPage=0,visible=true,returnPose=null,selectedPage='main';
 const rays=new Map(),pressed=new Map();let panelRevision=0;
 const buttonKey=b=>b?`${b.x}:${b.y}:${b.w}:${b.h}`:null;
 function clearPointing(){pressed.clear();for(const p of rays.values()){p.button=null;p.line.setEnabled(false);p.dot.setEnabled(false);}}
 const emitStatus=()=>status('WebXR preparado · teste físico no Quest 2 pendente');emitStatus();
 function center(){if(!panel)return;panelRevision++;clearPointing();const cam=xr.baseExperience.camera;const forward=cam.getForwardRay().direction;forward.y=0;if(forward.lengthSquared()<.001)forward.set(0,0,-1);else forward.normalize();panel.position.copyFrom(cam.position.add(forward.scale(panelDistance)));panel.position.y=cam.position.y-.05;panel.lookAt(cam.position);panel.computeWorldMatrix(true);draw(true);}
 function fitText(c,text,x,y,width,size=30,bold=false){let font=size;do{c.font=`${bold?'bold ':''}${font}px sans-serif`;if(c.measureText(text).width<=width)break;font--;}while(font>21);c.fillText(text,x,y);}
 function addButton(c,label,x,y,w,h,fn){const b={x,y,w,h,fn};const focused=[...rays.values()].some(p=>buttonKey(p.button)===buttonKey(b));c.fillStyle=focused?'#526d43':'#285747';c.fillRect(x,y,w,h);c.fillStyle='#fff';fitText(c,label,x+12,y+h/2+10,w-24,28,true);buttons.push(b);}
 function linesFor(c,text,width){const lines=[];let line='';for(const word of String(text||'Não informado na ficha.').split(/\s+/)){if(c.measureText(line+word).width>width&&line){lines.push(line.trimEnd());line='';}if(c.measureText(word).width>width){for(const ch of word){if(c.measureText(line+ch).width>width&&line){lines.push(line);line='';}line+=ch;}line+=' ';}else line+=word+' ';}if(line)lines.push(line.trimEnd());return lines;}
 function pagesFor(card){return [
 ['Problema',card.problema_identificado],['Local e evidência',card.local+' — '+(card.evidencias_geometricas||[]).join(' ')],['Consequência',card.consequencia_possivel],['Proposta conceitual',card.sugestao_correcao],['Referências',card.referencia_normativa_aplicavel],['Limitações',card.limitacoes],
 ['Conclusão documental',card.conclusao_individual],['Pendências',(card.informacoes_ainda_necessarias||[]).join(' ')],
 ...(card.normas_e_itens_pertinentes||[]).map(ref=>['Norma e fonte',`${ref.norma} · ${ref.edicao} · ${ref.item}. ${ref.explicacao_objetiva||''} ${ref.acesso_e_limites||''} ${ref.url||''}`])];}
 function startWalk(){if(model.technical){status('R05: volte à navegação antes de caminhar.');return;}visible=false;walk=true;motionArmed=false;turnReady=false;panel.setEnabled(false);clearPointing();status('Passeio sentado: esquerdo move; direito gira 30°. Grip abre menu e para.');}
 function openMenu(){walk=false;motionArmed=false;visible=true;panel?.setEnabled(true);clearPointing();center();}
 function draw(hoverOnly=false){if(!texture)return;if(!hoverOnly){panelRevision++;clearPointing();}buttons=[];const c=texture.getContext();c.setTransform(1.5,0,0,1.5,0,0);c.fillStyle='#102e27';c.fillRect(0,0,1024,768);c.fillStyle='#fff';c.font='bold 34px sans-serif';c.fillText('SAFEVISION 3D · ÁUREA',32,46);c.font='24px sans-serif';c.fillStyle='#f1d69e';c.fillText(`VR ${chosen.label} · Movimento parado`,32,80);addButton(c,'Altura 1,65 m',792,52,200,40,()=>{const cam=xr.baseExperience.camera;cam.position.y+=1.65-cam.globalPosition.y;center();});
  addButton(c,'Riscos',32,104,180,60,()=>{selectedPage='main';draw()});addButton(c,'Salas',226,104,180,60,()=>{selectedPage='rooms';draw()});addButton(c,'Passear',420,104,180,60,startWalk);addButton(c,'Centralizar',614,104,180,60,center);addButton(c,'Sair VR',808,104,184,60,()=>xr.baseExperience.exitXRAsync());
  if(selectedPage==='rooms'){
   const count=Math.ceil(model.config.rooms.length/5);model.config.rooms.slice(roomPage*5,roomPage*5+5).forEach((room,i)=>addButton(c,`${room.id} · ${room.name}`,32,184+i*74,960,64,()=>{try{inspection.leave();model.setTechnical(false);const p=model.safeSpawn(room);nav.teleport(p);xr.baseExperience.camera.position.copyFrom(world(p));center();}catch(e){status(e.message)}}));
   addButton(c,'Página anterior',32,590,300,60,()=>{roomPage=(roomPage+count-1)%count;draw()});addButton(c,'Próxima página',350,590,300,60,()=>{roomPage=(roomPage+1)%count;draw()});c.fillStyle='#fff';c.font='28px sans-serif';c.fillText(`${roomPage+1}/${count}`,700,630);
  }else{
   model.cards.forEach((card,i)=>addButton(c,card.codigo,32+i*194,180,180,60,()=>locate(card.codigo)));
   const card=model.cards.find(c=>c.codigo===selected);c.fillStyle='#fff';c.font='bold 30px sans-serif';const title=linesFor(c,`${selected} · ${card.nome_risco}`,960);title.slice(0,2).forEach((t,i)=>c.fillText(t,32,280+i*34));
   const pages=pagesFor(card);page=Math.min(page,pages.length-1);c.font='30px sans-serif';const lines=linesFor(c,pages[page][1],950);textPages=Math.max(1,Math.ceil(lines.length/4));textPage=Math.min(textPage,textPages-1);
   c.fillStyle='#f1d69e';c.font='25px sans-serif';c.fillText(`${pages[page][0]} · ${page+1}/${pages.length}`,32,351);c.fillText(`Trecho ${textPage+1}/${textPages}`,770,351);
   c.fillStyle='#fff';c.font='30px sans-serif';lines.slice(textPage*4,(textPage+1)*4).forEach((t,i)=>c.fillText(t,32,396+i*40));
   addButton(c,'Com problema',32,590,240,60,()=>state('PROB'));addButton(c,'Proposta',287,590,220,60,()=>state('CORR'));addButton(c,'Texto seguinte',522,590,260,60,()=>{if(textPage+1<textPages)textPage++;else{page=(page+1)%pages.length;textPage=0;}draw()});addButton(c,'Voltar',797,590,195,60,back);
  }
  addButton(c,panelDistance<1.2?'Afastar painel':'Aproximar painel',32,680,290,60,()=>{panelDistance=panelDistance<1.2?1.25:1.05;center()});addButton(c,'Giro esq.',338,680,176,60,()=>turn(-Math.PI/6));addButton(c,'Giro dir.',530,680,176,60,()=>turn(Math.PI/6));addButton(c,'Porta próxima',722,680,270,60,()=>{const cam=xr.baseExperience.camera;const door=model.nearestDoor(cam.position);if(door)model.operateDoor(door,cam.position,status);else status('Nenhuma porta próxima.');});
  c.strokeStyle='#ffd578';c.lineWidth=6;for(const p of rays.values()){const b=buttons.find(b=>buttonKey(b)===buttonKey(p.button));if(b)c.strokeRect(b.x+3,b.y+3,b.w-6,b.h-6);}texture.update();
 }
 function locate(code){if(!returnPose)returnPose=xr.baseExperience.camera.position.clone();selected=code;page=0;textPage=0;inspection.locate(code);xr.baseExperience.camera.position.copyFrom(nav.camera.position);center();}
 function state(value){if(inspection.selected!==selected)locate(selected);model.resetDoors();model.setState(selected,value);inspection.showAnalysis();draw();}
 function back(){inspection.leave();if(returnPose)xr.baseExperience.camera.position.copyFrom(returnPose);returnPose=null;center();}
 function turn(angle){const cam=xr.baseExperience.camera;cam.rotationQuaternion=B.Quaternion.RotationAxis(B.Axis.Y,angle).multiply(cam.rotationQuaternion);center();}
 function ensurePanel(){if(panel)return;panel=B.MeshBuilder.CreatePlane('UI_VR_INSPECAO',{width:1.44,height:1.08,sideOrientation:B.Mesh.DOUBLESIDE},scene);texture=new B.DynamicTexture('UI_VR_TEXTO',{width:1536,height:1152},scene,false,B.Texture.BILINEAR_SAMPLINGMODE);material=new B.StandardMaterial('UI_VR_MATERIAL',scene);material.diffuseTexture=texture;material.emissiveColor=B.Color3.White();material.disableLighting=true;material.backFaceCulling=false;panel.material=material;panel.isPickable=true;panel.renderingGroupId=3;draw();}
 // One target-ray calculation drives the visible laser, contact point and button hit.
 function point(controller){
  const p=rays.get(controller.uniqueId);if(!p||!p.tracked||!panel?.isEnabled()||xr.baseExperience.state!==B.WebXRState.IN_XR||xr.baseExperience.sessionManager.session.visibilityState!=='visible')return null;
  controller.pointer.computeWorldMatrix(true);controller.getWorldPointerRayToRef(p.ray);p.ray.length=2;
  panel.computeWorldMatrix(true);const hit=scene.pickWithRay(p.ray,m=>m===panel&&m.isEnabled(),false);
  const uv=hit?.hit?hit.getTextureCoordinates():null;let button=null;
  if(uv){const x=uv.x*1024,y=(1-uv.y)*768;button=buttons.find(b=>x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h)||null;}
  return {ray:p.ray,hit,button};
 }
 function select(source){
  const controller=xr.input.controllers.find(c=>c.inputSource===source),down=pressed.get(source);pressed.delete(source);
  if(!controller||!down||down.revision!==panelRevision)return;
  if(down.key==='door'&&walk&&!panel?.isEnabled()&&rays.get(controller.uniqueId)?.tracked){const cam=xr.baseExperience.camera;const door=model.nearestDoor(cam.position);if(door)model.operateDoor(door,cam.position,status);return;}
  const hit=point(controller);if(hit?.button&&buttonKey(hit.button)===down.key)hit.button.fn();
 }
 observe(xr.input.onControllerAddedObservable,controller=>{
  const line=B.MeshBuilder.CreateLines('VR_LASER',{points:[B.Vector3.Zero(),new B.Vector3(0,0,-2)],updatable:true},scene);line.color=new B.Color3(.8,.65,.35);line.isPickable=false;line.renderingGroupId=3;line.setEnabled(false);
  const dot=B.MeshBuilder.CreateSphere('VR_CONTATO',{diameter:.012,segments:8},scene);const dotMaterial=new B.StandardMaterial('VR_CONTATO_MATERIAL',scene);dotMaterial.emissiveColor=new B.Color3(.8,.65,.35);dotMaterial.disableLighting=true;dot.material=dotMaterial;dot.isPickable=false;dot.renderingGroupId=3;dot.setEnabled(false);
  rays.set(controller.uniqueId,{line,dot,dotMaterial,ray:new B.Ray(B.Vector3.Zero(),B.Vector3.Forward(),2),button:null,tracked:false});
 });
 observe(xr.input.onControllerRemovedObservable,c=>{const p=rays.get(c.uniqueId);if(p){p.line.dispose();p.dot.dispose();p.dotMaterial.dispose();}pressed.delete(c.inputSource);rays.delete(c.uniqueId);draw(true);});
 observe(xr.baseExperience.sessionManager.onXRFrameObservable,frame=>{
  try{headTracked=!!frame.getViewerPose(xr.baseExperience.sessionManager.referenceSpace);}catch{headTracked=false;}
  for(const controller of xr.input.controllers){const p=rays.get(controller.uniqueId);if(!p)continue;
   try{p.tracked=!!frame.getPose(controller.inputSource.targetRaySpace,xr.baseExperience.sessionManager.referenceSpace);}catch{p.tracked=false;}
   if(!p.tracked)pressed.delete(controller.inputSource);
  }
 });
 observe(xr.baseExperience.sessionManager.onXRSessionInit,session=>{
  sessionAbort?.abort();sessionAbort=new AbortController();const listen=(type,fn)=>session.addEventListener(type,fn,{signal:sessionAbort.signal});
  listen('selectstart',e=>{if(pressed.has(e.inputSource))return;const controller=xr.input.controllers.find(c=>c.inputSource===e.inputSource);const hit=controller?point(controller):null;pressed.set(e.inputSource,{key:walk&&!panel?.isEnabled()?'door':buttonKey(hit?.button),revision:panelRevision});});
  listen('select',e=>select(e.inputSource));
  listen('selectend',e=>pressed.delete(e.inputSource));
  listen('squeeze',openMenu);
  listen('visibilitychange',()=>{if(session.visibilityState!=='visible'){motionArmed=false;turnReady=false;clearPointing();draw(true);}});
 });
 observe(scene.onBeforeRenderObservable,()=>{
  if(xr.baseExperience.state!==B.WebXRState.IN_XR)return;
  const session=xr.baseExperience.sessionManager.session;const safe=walk&&!panel?.isEnabled()&&headTracked&&session?.visibilityState==='visible'&&!model.technical;
  const left=xr.input.controllers.find(c=>c.inputSource.handedness==='left'),right=xr.input.controllers.find(c=>c.inputSource.handedness==='right');
  const leftOK=left&&rays.get(left.uniqueId)?.tracked,rightOK=right&&rays.get(right.uniqueId)?.tracked;
  const l=leftOK?xrStick(left):{x:0,y:0},r=rightOK?xrStick(right):{x:0,y:0};
  if(!safe||!leftOK||!rightOK){motionArmed=false;turnReady=false;}else{
   if(Math.hypot(l.x,l.y,r.x)<.01)motionArmed=true;
   if(Math.abs(r.x)<.2)turnReady=true;
   if(motionArmed&&pressed.size===0){nav.moveXR(xr.baseExperience.camera,l.x,l.y,boundedDt(app.engine.getDeltaTime()/1000));if(turnReady&&Math.abs(r.x)>.65){const sign=scene.useRightHandedSystem?-1:1;turn(Math.sign(r.x)*sign*Math.PI/6);turnReady=false;}}
  }
  let changed=false;
  for(const controller of xr.input.controllers){const p=rays.get(controller.uniqueId);if(!p)continue;const result=point(controller),button=result?.button||null;
   if(buttonKey(p.button)!==buttonKey(button))changed=true;p.button=button;
   if(!result){p.line.setEnabled(false);p.dot.setEnabled(false);continue;}
   const {ray,hit}=result,end=hit?.hit?hit.pickedPoint:ray.origin.add(ray.direction.scale(ray.length));
   B.MeshBuilder.CreateLines(p.line.name,{points:[ray.origin,end],instance:p.line},scene);p.line.refreshBoundingInfo();p.line.setEnabled(true);
   p.dot.setEnabled(!!hit?.hit);if(hit?.hit)p.dot.position.copyFrom(hit.pickedPoint.subtract(ray.direction.scale(.008)));
  }
  if(changed)draw(true);
 });
 observe(xr.baseExperience.onStateChangedObservable,state=>{app.xrActive=state!==B.WebXRState.NOT_IN_XR;if(state===B.WebXRState.IN_XR){nav.pause();walk=false;motionArmed=false;ensurePanel();panel.setEnabled(true);center();status(`VR ${chosen.label} · escala solicitada ${chosen.scale}. Passear habilita analógicos; grip para.`);}if(state===B.WebXRState.NOT_IN_XR){walk=false;motionArmed=false;headTracked=false;sessionAbort?.abort();panel?.setEnabled(false);clearPointing();back();scene.activeCamera=nav.camera;ui.pause();status('Sessão VR encerrada · desktop disponível.')}});
 return {profile,dispose(){sessionAbort?.abort();for(const [o,t] of observers)o.remove(t);clearPointing();for(const p of rays.values()){p.line.dispose();p.dot.dispose();p.dotMaterial.dispose();}rays.clear();panel?.dispose();material?.dispose();texture?.dispose();xr.dispose();},async enter(){quality(app.desktopProfile||'balanced');nav.pause();inspection.leave();clearPointing();await xr.baseExperience.enterXRAsync('immersive-vr','local-floor',xr.renderTarget);},xr};
}

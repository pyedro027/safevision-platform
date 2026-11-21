import {PresentationControls} from './modules/presentation-controls.js';
import {installBridge} from './modules/bridge.js';
/* SAFEVISION V03: updated local viewer. No writes to the Blender project. */
import {ClinicModel,world,blender} from './modules/model.js';
import {Navigation} from './modules/navigation.js';
import {Inspection} from './modules/inspection.js';
import {Interface} from './modules/interface.js';
import {createQualityController} from './modules/quality.js';
async function startTour(){
if(window.safevisionFailed)return;
const B=window.BABYLON,canvas=document.getElementById('tour');
let ui,nav,model,inspection,ready=false,qualityController;
if(!B?.Engine)throw Error('Biblioteca 3D indisponível. Verifique a pasta WEB/vendor.');
let engine;try{engine=new B.Engine(canvas,true,{preserveDrawingBuffer:false,stencil:true,powerPreference:'default',doNotHandleContextLost:true});}catch(error){throw Error('Não foi possível iniciar o WebGL. Verifique o suporte 3D do navegador. Detalhe: '+error.message);}
window.safevisionStop=()=>{engine.stopRenderLoop();nav?.pause();};
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();window.safevisionFailure('A conexão gráfica WebGL foi interrompida. O tour foi parado. Registre a mensagem e encerre a aba; retome o teste somente quando o computador estiver estável.');});
engine.setHardwareScalingLevel(1);
const scene=new B.Scene(engine);scene.useRightHandedSystem=true;scene.collisionsEnabled=true;scene.clearColor=new B.Color4(.74,.8,.78,1);
const loadingCamera=new B.FreeCamera('loading_camera',new B.Vector3(-5,4,-5),scene);loadingCamera.setTarget(new B.Vector3(3,1,-5));scene.activeCamera=loadingCamera;
scene.imageProcessingConfiguration.toneMappingEnabled=true;scene.imageProcessingConfiguration.toneMappingType=B.ImageProcessingConfiguration.TONEMAPPING_ACES;scene.imageProcessingConfiguration.exposure=1.1;scene.imageProcessingConfiguration.contrast=1.08;
const ambient=new B.HemisphericLight('luz_ambiente_tour',new B.Vector3(0,1,0),scene);ambient.intensity=.66;ambient.groundColor=new B.Color3(.48,.44,.38);
const sun=new B.DirectionalLight('luz_geral_tour',new B.Vector3(-.35,-1,-.3),scene);sun.position=new B.Vector3(12,19,-6);sun.intensity=1.15;sun.diffuse=new B.Color3(1,.96,.87);sun.shadowMinZ=1;sun.shadowMaxZ=50;sun.shadowFrustumSize=34;
const shadow=new B.ShadowGenerator(512,sun);shadow.usePercentageCloserFiltering=true;shadow.filteringQuality=B.ShadowGenerator.QUALITY_LOW;shadow.bias=.0004;shadow.normalBias=.018;shadow.darkness=.15;
scene.shadowsEnabled=false;
let lastUI=0,lastMetrics=0,lastShadow=0,lastRender=0,renderFps=0;const measurements=[],renderTimes=[];
function quality(value){return qualityController.apply(value);}
async function boot(){
 model=new ClinicModel(scene);await model.load(p=>{document.getElementById('loadMessage').textContent=p?`Carregando a clínica · ${Math.round(p*100)}%`:'Preparando materiais…';if(p)document.getElementById('progressFill').style.width=`${Math.min(95,p*95)}%`;});
 if(window.safevisionFailed)return;
 nav=new Navigation(scene,canvas,model.config);
 for(const [id,g] of model.groups)for(const mesh of g.meshes){if(mesh.getTotalVertices()>0&&!/Vidro|Espelho/i.test(mesh.material?.name||''))shadow.addShadowCaster(mesh,false);}
 shadow.getShadowMap().refreshRate=0;
 scene.environmentIntensity=.58;
 const env=new B.HDRCubeTexture('assets/ambiente_v03.hdr',scene,128,false,true,false,true,()=>{scene.environmentIntensity=.58;},()=>{ui?.toast('Ambiente de reflexão indisponível; luzes locais mantidas.');});scene.environmentTexture=env;
 for(const room of model.config.rooms){
  const b=room.bounds,light=new B.PointLight('luz_ambiente_'+room.id,world([(b[0]+b[2])/2,(b[1]+b[3])/2,2.65]),scene);light.intensity=7;light.range=7;light.diffuse=new B.Color3(1,.93,.81);
  light.includedOnlyMeshes=[];
  for(const [id,g] of model.groups){if(id==='COMMON_'+room.id)light.includedOnlyMeshes.push(...g.meshes);else if(id.startsWith('R0')||id.startsWith('DOOR_'))for(const mesh of g.meshes){const c=mesh.getBoundingInfo().boundingBox.centerWorld;if(c.x>=b[0]-.2&&c.x<=b[2]+.2&&-c.z>=b[1]-.2&&-c.z<=b[3]+.2)light.includedOnlyMeshes.push(mesh);}}
 }
 qualityController=createQualityController(B,engine,scene,shadow,nav.camera,error=>{console.warn('Perfil gráfico:',error);ui?.toast('Não foi possível aplicar esse perfil. Mantido Baixo.');});
 inspection=new Inspection(model,nav,document.getElementById('markers'),code=>ui.openRisk(code,true));ui=new Interface(model,nav,inspection,quality);quality('balanced');document.getElementById('quality').value='balanced';
 const starts=model.config.rooms.map(room=>({id:room.id,position:model.safeSpawn(room)}));
 if(!model.freePosition(1.9,5))nav.teleport(starts.find(x=>x.id==='A01').position);
 scene.createDefaultSkybox(env,true,200,.5,false);ready=true;
 // Expensive instrumentation is opt-in, not needed by normal visitors.
 if(new URLSearchParams(location.search).has('qa')){const instrumentation=new B.SceneInstrumentation(scene);instrumentation.captureFrameTime=true;instrumentation.captureRenderTime=true;scene.onDisposeObservable.addOnce(()=>instrumentation.dispose());}
 window.__tourDebug={get ready(){return ready},scene,engine,model,nav,ui,inspection,starts,measurements,world,blender,snapshot:()=>({babylon:B.Engine.Version,loadMs:model.loadMs,quality:qualityController.name,viewport:[innerWidth,innerHeight],renderSize:[engine.getRenderWidth(),engine.getRenderHeight()],fps:renderFps,drawCalls:engine._drawCalls.current,activeMeshes:scene.getActiveMeshes().length,totalVertices:scene.getTotalVertices(),materials:scene.materials.length,textures:scene.textures.length,navigation:nav.snapshot(),model:model.snapshot(),memory:performance.memory?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize}:null})};
 window.__tourDebug.presentation=new PresentationControls(window.__tourDebug,quality);
 installBridge(window.__tourDebug,quality);
}
const bootPromise=boot();
engine.runRenderLoop(()=>{
 const now=performance.now(),elapsed=now-lastRender,interval=1000/(qualityController?.maxFPS||30);if(window.__tourDebug?.suspended||(!window.__tourDebug?.xrActive&&(document.hidden||elapsed<interval-.5)))return;lastRender=now;renderTimes.push(now);while(renderTimes.length>1&&now-renderTimes[0]>1000)renderTimes.shift();renderFps=renderTimes.length>1?(renderTimes.length-1)*1000/(now-renderTimes[0]):0;
 if(ready){window.__tourDebug.presentation.update();const dt=Math.min(elapsed/1000,.05);model.updateDoors(dt);if(!window.__tourDebug?.xrActive)nav.update(dt);
  if(!window.__tourDebug?.xrActive&&now-lastUI>150){ui.update();inspection.update();lastUI=now;}
  if(location.search.includes('qa')){canvas.dataset.qaPosition=JSON.stringify(blender(nav.camera.position));canvas.dataset.qaRotation=JSON.stringify(nav.camera.rotation.asArray());canvas.dataset.qaLocked=String(document.pointerLockElement===canvas);}
  if(scene.shadowsEnabled&&now-lastShadow>250){shadow.getShadowMap().resetRefreshCounter();lastShadow=now;}
  if(now-lastMetrics>1000){const sample={t:now,fps:renderFps,drawCalls:engine._drawCalls.current,room:model.roomAt(nav.camera.position)?.id||'EXTERIOR',mode:ui.mode};measurements.push(sample);if(measurements.length>600)measurements.shift();if(!document.getElementById('metrics').hidden)document.getElementById('metrics').textContent=`${sample.fps.toFixed(0)} FPS · ${sample.drawCalls} chamadas`;lastMetrics=now;}
 }
 scene.render();
});
addEventListener('resize',()=>engine.resize());
await bootPromise;
}
startTour().catch(error=>{console.error(error);window.__tourError=error.stack;window.safevisionFailure('Não foi possível abrir a clínica: '+error.message+' Verifique o servidor e mantenha todos os arquivos na pasta.');});

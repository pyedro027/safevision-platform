import {world,blender} from './model.js';
import {R05Technical} from './r05-technical.js';
const B=window.BABYLON;
export const RISK_NAMES={R01:'Circulação',R02:'Rota de saída',R03:'Acessibilidade',R04:'Janela × pilar',R05:'Tubulação × viga'};
const VIEWS={R01:{pos:[12.20,6.65,1.65],target:[12.83,5.4,1.15]},R02:{pos:[17.3,8.55,1.65],target:[19.35,8.1,1.15]},R03:{pos:[7.85,4.85,1.65],target:[7.4,6.65,.85]},R04:{pos:[3.55,12.4,1.65],target:[2.7,14.9,1.8]},R05:{pos:[6.7,12.8,3.15],target:[5.33,13.7,2.82]}};
export class Inspection {
 constructor(model,nav,container,onSelect){
  this.model=model;this.nav=nav;this.container=container;this.enabled=true;this.selected=null;this.returnPose=null;this.markers=[];this.nearCode=null;
  for(const card of model.cards){const button=document.createElement('button');button.className='risk-marker';button.textContent=card.codigo;button.title=card.codigo+' — '+RISK_NAMES[card.codigo];button.setAttribute('aria-label','Abrir inspeção '+button.title);button.hidden=true;button.onclick=()=>onSelect(card.codigo);container.append(button);this.markers.push({card,button});}
 }
 setEnabled(enabled){this.enabled=enabled;this.container.hidden=!enabled;if(!enabled)this.nearCode=null;}
 locate(code){
  if(!this.returnPose)this.returnPose={position:blender(this.nav.camera.position),rotation:this.nav.camera.rotation.clone()};
  this.selected=code;this.nav.pause();this.model.setTechnical(code==='R05');this.nav.teleport(VIEWS[code].pos,VIEWS[code].target);this.showAnalysis();
 }
 showAnalysis(){
  this.analysis?.dispose();this.analysis=null;this.technical?.dispose();this.technical=null;
  if(this.selected==='R05'){this.technical=new R05Technical(this.model.scene,this.container,this.model.states.R05);return;}
  if(this.selected!=='R03')return;
  const points=[[6.95,5.75,.026],[7.75,5.75,.026],[7.75,6.95,.026],[6.95,6.95,.026],[6.95,5.75,.026]].map(world);
  this.analysis=B.MeshBuilder.CreateLines('referencia_transferencia',{points},this.model.scene);this.analysis.color=this.model.states.R03==='PROB'?new B.Color3(.84,.4,.16):new B.Color3(.18,.5,.36);this.analysis.isPickable=false;
 }
 leave(){this.model.setTechnical(false);this.analysis?.dispose();this.analysis=null;this.technical?.dispose();this.technical=null;if(this.returnPose){this.nav.teleport(this.returnPose.position);this.nav.camera.rotation.copyFrom(this.returnPose.rotation);}this.returnPose=null;this.selected=null;}
 anchor(card){return world(card.ancoras.find(a=>a.state===this.model.states[card.codigo]).anchor);}
 lineOfSight(anchor){const camera=this.nav.camera,delta=anchor.subtract(camera.position),distance=delta.length();if(distance<.05)return true;const ray=new B.Ray(camera.position,delta.normalize(),distance);return !this.model.colliders.some(c=>{if(!c.isEnabled()||!['wall','door'].includes(c.metadata.kind))return false;c.computeWorldMatrix(true);const hit=ray.intersectsMesh(c);return hit.hit&&hit.distance<distance-.08;});}
 nearest(){
  if(!this.enabled){this.nearCode=null;return null;}
  const camera=this.nav.camera;
  const candidates=this.markers.map(m=>{const anchor=this.anchor(m.card);return {code:m.card.codigo,anchor,distance:B.Vector3.Distance(camera.position,anchor)};}).filter(m=>m.distance<(m.code===this.nearCode?3:2.6)&&this.lineOfSight(m.anchor));
  // Hysteresis keeps the prompt stable at the edge; wall/door occlusion is immediate.
  const retained=candidates.find(m=>m.code===this.nearCode);this.nearCode=(retained||candidates.sort((a,b)=>a.distance-b.distance)[0])?.code||null;return this.nearCode;
 }
 update(){
  if(!this.enabled)return;const scene=this.model.scene;const camera=this.nav.camera;const w=this.container.clientWidth,h=this.container.clientHeight;
  for(const m of this.markers){
   const state=this.model.states[m.card.codigo];const anchor=this.anchor(m.card);const delta=anchor.subtract(camera.position);const distance=delta.length();
   let visible=distance<7&&B.Vector3.Dot(delta,camera.getForwardRay().direction)>.1;
   if(visible)visible=this.lineOfSight(anchor);
   if(this.selected==='R05')visible=false;
   const p=B.Vector3.Project(anchor,B.Matrix.Identity(),scene.getTransformMatrix(),camera.viewport.toGlobal(w,h));visible=visible&&p.z>=0&&p.z<=1&&p.x>20&&p.x<w-20&&p.y>85&&p.y<h-90;
   m.button.hidden=!visible;m.button.classList.toggle('proposal',state==='CORR');if(visible)m.button.style.transform=`translate(${p.x-20}px,${p.y-20}px)`;
  }
  this.technical?.update(scene,camera,w,h);
 }
}

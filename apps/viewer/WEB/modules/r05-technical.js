/* Digital annotations from the documented V03 bounds. No imported mesh edits. */
import {world} from './model.js';
const B=window.BABYLON;
export const R05_EVIDENCE={beamMin:[5,9.4,2.65],beamMax:[5.3,15,3.1],intersectionMin:[5.212827,13.6875,2.65],intersectionMax:[5.3,13.7125,2.862172]};
function edges(min,max){
 const points=Array.from({length:8},(_,i)=>world(min.map((v,a)=>(i&(1<<a))?max[a]:v)));
 const lines=[];for(let i=0;i<8;i++)for(let a=0;a<3;a++)if(!(i&(1<<a)))lines.push([points[i],points[i|(1<<a)]]);return lines;
}
export class R05Technical {
 constructor(scene,container,state){
  this.meshes=[];this.labels=[];this.container=container;this.state=state;
  const orange=new B.Color3(.86,.43,.18),green=new B.Color3(.25,.65,.46),gold=new B.Color3(.78,.65,.36);
  const wire=(name,min,max,color)=>{const m=B.MeshBuilder.CreateLineSystem(name,{lines:edges(min,max)},scene);m.color=color;m.isPickable=false;m.metadata={digitalAnalysis:true};this.meshes.push(m);};
  wire('DIGITAL_R05_VIGA',R05_EVIDENCE.beamMin,R05_EVIDENCE.beamMax,gold);
  const proposal=state==='CORR',x=proposal?5.36:5.225;
  if(!proposal)wire('DIGITAL_R05_INTERSECAO_DOCUMENTADA',R05_EVIDENCE.intersectionMin,R05_EVIDENCE.intersectionMax,orange);
  // Leader endpoints lie on documented beam, pipe and intersection; not new pipe geometry.
  const entries=[
   {text:'VIGA',anchor:[5.3,13.20,3.1],label:[5.45,12.9,3.3],color:gold},
   {text:'TUBULAÇÃO',anchor:[6.1,13.7,2.85],label:[6.3,13.95,3.06],color:proposal?green:orange},
   {text:proposal?'DESVIO PROPOSTO':'INTERFERÊNCIA',anchor:proposal?[x,13.7,2.76]:[5.2564,13.7,2.7561],label:[5.8,13.3,2.48],color:proposal?green:orange}
  ];
  for(const e of entries){const line=B.MeshBuilder.CreateLines('DIGITAL_R05_'+e.text,{points:[world(e.anchor),world(e.label)]},scene);line.color=e.color;line.isPickable=false;line.metadata={digitalAnalysis:true};this.meshes.push(line);const el=document.createElement('span');el.className='technical-tag'+(proposal?' proposal':'');el.textContent=e.text;el.hidden=true;container.append(el);this.labels.push({el,point:world(e.label)});}
 }
 update(scene,camera,w,h){for(const {el,point} of this.labels){const p=B.Vector3.Project(point,B.Matrix.Identity(),scene.getTransformMatrix(),camera.viewport.toGlobal(w,h));el.hidden=p.z<0||p.z>1||p.x<10||p.x>w-10||p.y<90||p.y>h-100;if(!el.hidden)el.style.transform=`translate(${p.x}px,${p.y}px)`;}}
 dispose(){for(const m of this.meshes)m.dispose();for(const {el} of this.labels)el.remove();this.meshes=[];this.labels=[];}
}

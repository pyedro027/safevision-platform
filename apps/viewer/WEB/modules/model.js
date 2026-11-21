/* Existing local Babylon loader, now with explicit V03 groups and states. */
const B=window.BABYLON;
export const world=([x,y,z])=>new B.Vector3(x,z,-y);
export const blender=v=>[v.x,-v.z,v.y];
export class ClinicModel {
 constructor(scene){this.scene=scene;this.states=Object.fromEntries([1,2,3,4,5].map(n=>['R0'+n,'PROB']));this.groups=new Map();this.colliders=[];this.doors=[];this.technical=false;}
 async load(progress){
  const t=performance.now();this.config=await fetch('../MODELO/nav_config.json').then(r=>{if(!r.ok)throw Error('Dados de navegação indisponíveis');return r.json()});
  this.cards=await Promise.all([1,2,3,4,5].map(async n=>{const code=`R0${n}`,r=await fetch(`data/fichas/${code}.json`);if(!r.ok)throw Error(`Ficha ${code} indisponível (HTTP ${r.status})`);const card=await r.json();if(card.codigo!==code||!Array.isArray(card.ancoras)||!['PROB','CORR'].every(state=>card.ancoras.some(a=>a.state===state&&Array.isArray(a.anchor)&&a.anchor.length===3)))throw Error(`Ficha ${code} com dados incompletos`);return card;}));
  const manifest=await fetch('../MODELO/model-manifest.json').then(r=>{if(!r.ok)throw Error('Manifesto indisponível');return r.json()});
  // Keep verified parts as Blobs instead of a second contiguous 113 MB buffer.
  const parts=[];let offset=0,url;
  try{
   for(const part of manifest.parts){
    let data;
    for(let attempt=0;attempt<3;attempt++){
     const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),60000);
     try{
      const response=await fetch('../MODELO/'+part.file,{signal:abort.signal});
      if(!response.ok){const error=Error(`HTTP ${response.status}: ${part.file}`);error.permanent=response.status>=400&&response.status<500&&![408,429].includes(response.status);throw error;}
      data=await response.arrayBuffer();
      if(data.byteLength!==part.size)throw Error('Tamanho incorreto: '+part.file);
      const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),v=>v.toString(16).padStart(2,'0')).join('');
      if(digest!==part.sha256)throw Error('Falha de integridade: '+part.file);
      break;
     }catch(error){data=null;if(error.permanent||attempt===2)throw Error(`Falha ao carregar ${part.file}: ${error.message}. Recarregue para tentar novamente.`);await new Promise(resolve=>setTimeout(resolve,500*(attempt+1)));}
     finally{clearTimeout(timer);}
    }
    parts.push(new Blob([data]));offset+=data.byteLength;data=null;progress(offset/manifest.bytes);
   }
   if(offset!==manifest.bytes)throw Error('Modelo incompleto');
   url=URL.createObjectURL(new Blob(parts,{type:'model/gltf-binary'}));parts.length=0;
   await B.SceneLoader.AppendAsync('',url,this.scene,undefined,'.glb');
  }finally{parts.length=0;if(url)URL.revokeObjectURL(url);}
  for(const [id,meta] of Object.entries(this.config.groups)){
   const node=this.scene.getTransformNodeByName(id)||this.scene.getMeshByName(id);
   if(!node)throw Error('Grupo ausente: '+id);
   const meshes=node.getChildMeshes(false);if(node instanceof B.Mesh)meshes.unshift(node);
   this.groups.set(id,{node,meshes,meta});
   for(const m of meshes){m.checkCollisions=false;m.isPickable=true;m.receiveShadows=true;}
  }
  this.box('floor',this.config.floor.min,this.config.floor.max,'COMMON','floor');
  for(const c of this.config.colliders)this.box(c.id,c.min,c.max,c.group,c.kind);
  for(const d of this.config.doors){
   const root=this.groups.get(d.id).node;const mesh=this.box('COL_'+d.id,d.leaf_bounds[0],d.leaf_bounds[1],d.id,'door');
   mesh.unfreezeWorldMatrix();mesh.setParent(root);mesh.computeWorldMatrix(true);
   this.doors.push({...d,root,collider:mesh,baseRotation:(root.rotationQuaternion||B.Quaternion.Identity()).clone(),basePosition:root.position.clone(),fraction:d.initial_open?1:0,target:d.initial_open?1:0});
  }
  this.applyStates();this.loadMs=performance.now()-t;
  return this;
 }
 box(id,min,max,group,kind){
  const m=B.MeshBuilder.CreateBox(id,{width:max[0]-min[0],height:max[2]-min[2],depth:max[1]-min[1]},this.scene);
  m.position=world(min.map((v,i)=>(v+max[i])/2));m.visibility=0;m.isPickable=false;m.checkCollisions=true;m.metadata={group,kind,min,max};m.computeWorldMatrix(true);m.freezeWorldMatrix();this.colliders.push(m);return m;
 }
 groupOn(id){
  const meta=this.config.groups[id];const state=meta?.state||'COMMON';
  if(meta?.technical_cover&&this.technical)return false;
  if(state==='COMMON')return true;
  return this.states[state.slice(0,3)]===state.slice(4);
 }
 applyStates(){
  for(const [id,g] of this.groups)g.node.setEnabled(this.groupOn(id));
  for(const c of this.colliders){const active=this.groupOn(c.metadata.group);c.setEnabled(active);c.checkCollisions=active;}
 }
 setState(code,state){if(!['PROB','CORR'].includes(state)||!(code in this.states))throw Error('Estado inválido');this.states[code]=state;this.applyStates();}
 setTechnical(value){this.technical=value;this.applyStates();}
 nearestDoor(position){return this.doors.filter(d=>this.groupOn(d.id)).map(d=>({door:d,distance:B.Vector3.Distance(position,world([d.aperture[0],d.aperture[1],position.y]))})).sort((a,b)=>a.distance-b.distance).find(d=>d.distance<1.95)?.door;}
 operateDoor(d,position,notify=()=>{}){
  if(!d||!this.groupOn(d.id))return false;
  const width=Math.max(d.leaf_bounds[1][0]-d.leaf_bounds[0][0],d.leaf_bounds[1][1]-d.leaf_bounds[0][1]);
  const hinge=world([d.pivot[0],d.pivot[1],position.y]);
  if(d.target===1&&d.kind==='hinged'&&B.Vector3.Distance(position,hinge)<width+.3){notify('Afaste-se um pouco da folha para fechar a porta.');return false;}
  d.target=d.target?0:1;return true;
 }
 updateDoors(dt){
  for(const d of this.doors){
   if(Math.abs(d.fraction-d.target)<.0001)continue;
   d.fraction+=Math.sign(d.target-d.fraction)*Math.min(Math.abs(d.target-d.fraction),dt*1.6);
   if(d.kind==='hinged'){
    const a=d.closed_delta+(d.open_delta-d.closed_delta)*d.fraction;
    d.root.rotationQuaternion=d.baseRotation.multiply(B.Quaternion.RotationAxis(B.Axis.Y,a));
   }else d.root.position.copyFrom(d.basePosition.add(world(d.closed_translation).scale(1-d.fraction)));
   d.root.computeWorldMatrix(true);d.collider.computeWorldMatrix(true);
  }
 }
 resetDoors(){for(const d of this.doors){d.fraction=d.initial_open?1:0;d.target=d.fraction;d.root.position.copyFrom(d.basePosition);d.root.rotationQuaternion=d.baseRotation.clone();d.root.computeWorldMatrix(true);d.collider.computeWorldMatrix(true);}}
 roomAt(p){const [x,y]=blender(p);return this.config.rooms.find(r=>x>=r.bounds[0]&&x<=r.bounds[2]&&y>=r.bounds[1]&&y<=r.bounds[3]);}
 freePosition(x,y,radius=.27){
  const p=world([x,y,.85]);
  return !this.colliders.some(c=>{
   if(!c.isEnabled()||c.metadata.kind==='floor')return false;
   c.computeWorldMatrix(true);const box=c.getBoundingInfo().boundingBox;const lo=box.minimumWorld,hi=box.maximumWorld;
   if(hi.y<.17||lo.y>1.8)return false;
   return p.x>lo.x-radius&&p.x<hi.x+radius&&p.z>lo.z-radius&&p.z<hi.z+radius;
  });
 }
 safeSpawn(room){
  if(room.spawn_blender_xyz&&this.freePosition(room.spawn_blender_xyz[0],room.spawn_blender_xyz[1],.245))return [...room.spawn_blender_xyz];
  const [x0,y0,x1,y1]=room.bounds;let best=null;
  for(let x=x0+.36;x<x1-.35;x+=.16)for(let y=y0+.36;y<y1-.35;y+=.16){
   if(!this.freePosition(x,y))continue;
   const score=(x-(x0+x1)/2)**2+(y-(y0+y1)/2)**2;
   if(!best||score<best.score)best={score,pos:[x,y,1.65]};
  }
  if(!best)throw Error('Nenhum ponto livre validado em '+room.id);return best.pos;
 }
 snapshot(){return {states:{...this.states},technical:this.technical,groups:[...this.groups].map(([id,g])=>({id,enabled:g.node.isEnabled()})),doors:this.doors.map(d=>({id:d.id,open:d.fraction,enabled:this.groupOn(d.id)})),loadMs:this.loadMs};}
}

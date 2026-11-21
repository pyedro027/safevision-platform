/* WASD, mouse fallback and ellipsoid movement retained from the previous tour. */
import {world,blender} from './model.js';
import {boundedDt} from './input-math.js';
const B=window.BABYLON;
export class Navigation {
 constructor(scene,canvas,config){
  this.scene=scene;this.canvas=canvas;this.config=config;this.keys=new Set();this.active=false;this.dragging=false;this.speed=1.35;this.sensitivity=.002;this.velocity=B.Vector3.Zero();this.vertical=0;this.virtualInput={x:0,y:0,turn:0};
  this.camera=new B.UniversalCamera('olhar_primeira_pessoa',B.Vector3.Zero(),scene);this.camera.inputs.clear();this.camera.minZ=.055;this.camera.maxZ=100;this.camera.fov=config.fov_degrees*Math.PI/180;scene.activeCamera=this.camera;
  this.player=B.MeshBuilder.CreateSphere('corpo_navegacao',{diameter:.1,segments:4},scene);this.player.isVisible=false;this.player.isPickable=false;this.player.ellipsoid=new B.Vector3(.25,.83,.25);this.eyeOffset=.82;
  this.teleport(config.start_blender_xyz,config.start_blender_xyz.map((v,i)=>v+config.forward_blender_xyz[i]));
  addEventListener('keydown',e=>{if(!this.active||e.target.matches('input,select,textarea'))return;if(['KeyW','KeyA','KeyS','KeyD','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','ShiftLeft'].includes(e.code)){e.preventDefault();this.keys.add(e.code);}});
  addEventListener('keyup',e=>this.keys.delete(e.code));addEventListener('blur',()=>{this.pause();this.onEscape?.()});
  this.resumeToken=0;this.invertY=false;
  document.addEventListener('pointerlockchange',()=>{const wasLocked=this.locked;this.locked=document.pointerLockElement===canvas;if(this.locked&&!this.active){this.locked=false;document.exitPointerLock();}else if(!this.locked&&wasLocked){this.pause();this.onEscape?.()}this.updateMouseHint();});
  document.addEventListener('pointerlockerror',()=>this.updateMouseHint());
  const look=e=>{if(e.type=='pointermove'&&document.pointerLockElement===canvas)return;if(this.active&&(document.pointerLockElement===canvas||this.dragging)){const locked=document.pointerLockElement===canvas;const dx=locked?e.movementX:e.clientX-this.lastX,dy=locked?e.movementY:e.clientY-this.lastY;this.look(dx,dy);this.lastX=e.clientX;this.lastY=e.clientY;}};document.addEventListener('mousemove',look);document.addEventListener('pointermove',look);
  const dragStart=e=>{if(this.active&&e.button===0){this.dragging=true;this.lastX=e.clientX;this.lastY=e.clientY;}};
  canvas.addEventListener('pointerdown',dragStart);canvas.addEventListener('mousedown',dragStart);document.addEventListener('pointerup',()=>this.dragging=false);document.addEventListener('mouseup',()=>this.dragging=false);document.addEventListener('pointercancel',()=>this.dragging=false);
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  if(new URLSearchParams(location.search).get('qa')==='manual'){
   const events=[];for(const type of ['pointerdown','mousedown','mousemove','pointermove','pointerup','mouseup'])document.addEventListener(type,e=>{events.push({type,x:e.clientX,y:e.clientY,active:this.active,drag:this.dragging,target:e.target.id,rotation:this.camera.rotation.asArray()});if(events.length>12)events.shift();canvas.dataset.qaMouse=JSON.stringify(events);});
  }
 }
 look(dx,dy){if(!Number.isFinite(dx)||!Number.isFinite(dy))return;const sign=this.scene.useRightHandedSystem?-1:1;this.camera.rotation.y+=sign*dx*this.sensitivity;this.camera.rotation.x=Math.max(-1.35,Math.min(1.35,this.camera.rotation.x+sign*dy*this.sensitivity*(this.invertY?-1:1)));}
 updateMouseHint(){const hint=document.getElementById('mouseHint');if(hint)hint.textContent=document.pointerLockElement===this.canvas?'mouse para olhar':'segure e arraste para olhar';}
 async resume(){const token=++this.resumeToken;this.active=true;this.keys.clear();this.canvas.focus();try{await this.canvas.requestPointerLock?.()}catch{}if(token!==this.resumeToken||!this.active){if(!this.active&&document.pointerLockElement===this.canvas){this.locked=false;document.exitPointerLock();}return;}this.updateMouseHint();}
 pause(){this.clearVirtualInput();this.resumeToken++;this.active=false;this.keys.clear();this.velocity.set(0,0,0);this.dragging=false;if(document.pointerLockElement===this.canvas){this.locked=false;document.exitPointerLock();}}
 teleport(position,target){this.player.position.copyFrom(world(position));this.player.position.y-=this.eyeOffset;this.player.computeWorldMatrix(true);this.velocity.set(0,0,0);this.vertical=0;this.sync();if(target)this.camera.setTarget(world(target));}
 sync(){this.camera.position.copyFrom(this.player.position);this.camera.position.y+=this.eyeOffset;}
 clearVirtualInput(){this.virtualInput={x:0,y:0,turn:0};this.velocity.set(0,0,0);}
 setVirtualInput(x=0,y=0,turn=0){this.virtualInput={x,y,turn};}
 // Same ellipsoid and same scene collision coordinator as WASD; horizontal XR delta only.
 moveXR(camera,x,y,dt){
  dt=boundedDt(dt);const f=camera.getForwardRay().direction.clone();f.y=0;
  if(f.lengthSquared()<.0001)return;f.normalize();const right=B.Vector3.Cross(f,B.Axis.Y).normalize();
  const v=right.scale(x).add(f.scale(-y));if(v.lengthSquared()>1)v.normalize();v.scaleInPlace(Math.min(this.speed,1.35)*dt);
  this.player.position.x=camera.position.x;this.player.position.z=camera.position.z;
  const start=this.player.position.clone();this.player.computeWorldMatrix(true);this.player.moveWithCollisions(v);this.player.computeWorldMatrix(true);
  camera.position.x+=this.player.position.x-start.x;camera.position.z+=this.player.position.z-start.z;
 }
 update(dt){
  if(!this.active)return;dt=boundedDt(dt);
  const sign=this.scene.useRightHandedSystem?-1:1;
  this.camera.rotation.y+=sign*this.virtualInput.turn*dt*1.1;
  if(this.keys.has('ArrowLeft'))this.camera.rotation.y-=sign*dt*1.1;if(this.keys.has('ArrowRight'))this.camera.rotation.y+=sign*dt*1.1;
  if(this.keys.has('ArrowUp'))this.camera.rotation.x=Math.max(-1.35,Math.min(1.35,this.camera.rotation.x-sign*dt*.8));if(this.keys.has('ArrowDown'))this.camera.rotation.x=Math.max(-1.35,Math.min(1.35,this.camera.rotation.x+sign*dt*.8));
  const f=this.camera.getForwardRay().direction.clone();f.y=0;f.normalize();const right=B.Vector3.Cross(f,B.Axis.Y).normalize();
  let v=right.scale(this.virtualInput.x).add(f.scale(-this.virtualInput.y));if(this.keys.has('KeyW'))v.addInPlace(f);if(this.keys.has('KeyS'))v.subtractInPlace(f);if(this.keys.has('KeyD'))v.addInPlace(right);if(this.keys.has('KeyA'))v.subtractInPlace(right);
  if(v.lengthSquared()>1)v.normalize();
  if(v.lengthSquared()>0)v.scaleInPlace(this.speed*(this.keys.has('ShiftLeft')?1.35:1));
  this.velocity=B.Vector3.Lerp(this.velocity,v,1-Math.exp(-12*dt));this.vertical=Math.max(-3,this.vertical-9.81*dt);
  const before=this.player.position.y;const move=this.velocity.scale(dt);move.y=this.vertical*dt;this.player.computeWorldMatrix(true);this.player.moveWithCollisions(move);this.player.computeWorldMatrix(true);
  if(Math.abs(this.player.position.y-before)<.002)this.vertical=0;
  this.sync();if(this.player.position.y<-.4)this.teleport(this.config.start_blender_xyz);
 }
 snapshot(){return {position:blender(this.camera.position),rotation:this.camera.rotation.asArray(),active:this.active,pointerLocked:document.pointerLockElement===this.canvas,speed:this.speed};}
}

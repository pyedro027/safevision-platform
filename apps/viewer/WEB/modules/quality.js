// Conventional rendering and XR render targets have separate controls.
export const PROFILES=Object.freeze({
 low:{label:'Desempenho',pixelRatio:.8,maxFPS:30},
 balanced:{label:'Equilibrado',pixelRatio:1,maxFPS:60},
 high:{label:'Nitidez',pixelRatio:1.5,maxFPS:60}
});
export const XR_PROFILES=Object.freeze({low:{label:'Desempenho',scale:.65},balanced:{label:'Equilibrado',scale:.85},high:{label:'Nitidez',scale:1}});
export function desktopScale(value,dpr=1){const p=PROFILES[value]||PROFILES.balanced;return 1/Math.min(Math.max(1,dpr),p.pixelRatio);}
export function createQualityController(B,engine,scene,shadow,camera,onError=()=>{}){
 let current='balanced';
 return {get name(){return current;},get maxFPS(){return PROFILES[current].maxFPS;},
 apply(value){const next=Object.hasOwn(PROFILES,value)?value:'balanced';try{
  engine.setHardwareScalingLevel(desktopScale(next,globalThis.devicePixelRatio||1));
  // Prioritize resolution; no AO/FXAA or shadow passes added on top of the heavy model.
  scene.shadowsEnabled=false;current=next;engine.resize();
 }catch(error){onError(error);}return current;}};
}

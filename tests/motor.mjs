import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const B=require('../apps/viewer/WEB/vendor/babylon.js');globalThis.window={BABYLON:B,addEventListener(){},removeEventListener(){}};
const {stick,xrStick,standardPad,boundedDt}=await import('../apps/viewer/WEB/modules/input-math.js');
const {desktopScale,XR_PROFILES}=await import('../apps/viewer/WEB/modules/quality.js');
const {Navigation}=await import('../apps/viewer/WEB/modules/navigation.js');
const {ClinicModel}=await import('../apps/viewer/WEB/modules/model.js');
const results=[];function test(name,fn){fn();results.push({name,status:'pass'});}
test('deadzone, NaN and diagonal cap',()=>{assert.deepEqual(stick(.1,.1),{x:0,y:0});assert.deepEqual(stick(NaN,0),{x:0,y:0});assert.ok(Math.abs(Math.hypot(...Object.values(stick(1,1)))-1)<1e-9);});
test('unknown mappings do not drive camera',()=>{assert.equal(standardPad({connected:true,mapping:'',axes:[1,1,1,1]}),null);assert.deepEqual(xrStick({inputSource:{gamepad:{mapping:'',axes:[1,1,1,1]}}}),{x:0,y:0});});
test('xr-standard and semantic thumbstick mappings',()=>{assert.equal(xrStick({inputSource:{gamepad:{mapping:'xr-standard',axes:[0,0,1,0]}}}).x,1);assert.equal(xrStick({inputSource:{gamepad:{mapping:'',axes:[]}},motionController:{getComponentOfType:()=>({axes:{x:0,y:-1}})}}).y,-1);});
test('quality levels and bounded timestep',()=>{assert.equal(desktopScale('balanced',2),1);assert.equal(desktopScale('high',2),2/3);assert.equal(desktopScale('low',2),1.25);assert.deepEqual(Object.values(XR_PROFILES).map(x=>x.scale),[.65,.85,1]);assert.equal(boundedDt(3),.04);});
const engine=new B.NullEngine();
function motor(scene){const nav=Object.create(Navigation.prototype);nav.scene=scene;nav.speed=1.35;nav.player=B.MeshBuilder.CreateSphere('motor',{diameter:.1},scene);nav.player.isVisible=false;nav.player.ellipsoid=new B.Vector3(.25,.83,.25);nav.player.position.y=.85;const camera=new B.FreeCamera('camera',new B.Vector3(0,1.65,0),scene);camera.setTarget(new B.Vector3(0,1.65,-1));scene.activeCamera=camera;return {nav,camera};}
test('frame-rate independent horizontal motor; no diagonal gain',()=>{const distances=[];for(const fps of [30,72,90]){const scene=new B.Scene(engine);scene.useRightHandedSystem=true;scene.collisionsEnabled=true;const {nav,camera}=motor(scene);for(let i=0;i<fps;i++)nav.moveXR(camera,0,-1,1/fps);distances.push(-camera.position.z);assert.equal(camera.position.y,1.65);scene.dispose();}assert.ok(distances.every(v=>Math.abs(v-1.35)<.01));});
test('same ellipsoid blocks against real F060 collider',()=>{const scene=new B.Scene(engine);scene.useRightHandedSystem=true;scene.collisionsEnabled=true;const {nav,camera}=motor(scene);const model=new ClinicModel(scene);model.config=JSON.parse(readFileSync(new URL('../apps/viewer/MODELO/nav_config.json',import.meta.url)));for(const c of model.config.colliders){const mesh=model.box(c.id,c.min,c.max,c.group,c.kind);mesh.setEnabled(model.groupOn(c.group));}camera.position.set(17.2,1.65,-5.2);camera.setTarget(new B.Vector3(17.2,1.65,-6.2));for(let i=0;i<180;i++)nav.moveXR(camera,1,0,1/60);assert.ok(camera.position.x<17.61,`x=${camera.position.x}`);assert.ok(camera.position.x>17.2,`x=${camera.position.x}`);scene.dispose();});
engine.dispose();console.log(JSON.stringify(results));

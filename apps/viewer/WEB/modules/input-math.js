// Pure input rules shared by desktop and XR; unknown mappings never guessed.
export function stick(x=0,y=0,deadzone=.18){
 if(!Number.isFinite(x)||!Number.isFinite(y))return {x:0,y:0};
 const length=Math.hypot(x,y);if(length<=deadzone)return {x:0,y:0};
 const amount=Math.min(1,(length-deadzone)/(1-deadzone));return {x:x/length*amount,y:y/length*amount};
}
export function xrStick(controller){
 const gp=controller?.inputSource?.gamepad;
 if(!gp||gp.connected===false)return {x:0,y:0};
 // Indices are defined by xr-standard, only after checking the actual mapping.
 if(gp.mapping==='xr-standard'&&gp.axes.length>=4)return stick(gp.axes[2],gp.axes[3]);
 const component=controller.motionController?.getComponentOfType('thumbstick');
 return component?.axes?stick(component.axes.x,component.axes.y):{x:0,y:0};
}
export function standardPad(gp){
 if(!gp?.connected||gp.mapping!=='standard'||gp.axes.length<4)return null;
 return {move:stick(gp.axes[0],gp.axes[1]),look:stick(gp.axes[2],gp.axes[3]),trigger:!!gp.buttons[7]?.pressed};
}
export function boundedDt(dt){return Number.isFinite(dt)?Math.max(0,Math.min(dt,.04)):0;}

"""Compare release XR paths and revised top-level entry using Meta's IWER runtime."""
import functools
import http.server
import json
import os
import re
import threading
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

ROOT = Path(__file__).resolve().parents[1]
EMULATOR = Path(os.environ["SAFEVISION_IWER"])
EVIDENCE = Path(os.environ["SAFEVISION_QUEST_QA"])
EVIDENCE.mkdir(parents=True, exist_ok=True)

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args):
        pass

def script_route(route):
    route.fulfill(path=EMULATOR,content_type="text/javascript")

def emulator(page,origin):
    page.route(origin+"/__iwer.js",script_route)
    page.add_init_script("""window.questEmulator = import('/__iwer.js').then(({XRDevice,metaQuest2})=>{
      const device=new XRDevice(metaQuest2,{stereoEnabled:true});
      device.installRuntime({forceInstall:true});
      device.controllers.left.connected=true;
      device.controllers.right.connected=true;
      window.questDevice=device;
      const request=navigator.xr.requestSession.bind(navigator.xr);
      navigator.xr.requestSession=(mode,options)=>request(mode,options).then(session=>{
        if(mode==='immersive-vr') window.questSession=session;
        return session;
      });
      return device;
    });""")

def diagnostics(page):
    return page.evaluate("() => JSON.parse(localStorage.getItem('safevision:quest:diagnostico:v1'))")

def await_event(page,label,timeout=25000):
    page.wait_for_function("""event=>JSON.parse(localStorage.getItem('safevision:quest:diagnostico:v1'))
       ?.events.some(row=>row.event===event)""",arg=label,timeout=timeout)

def wait_frames(frame):
    frame.wait_for_function("window.__tourDebug?.xrActive && window.__tourDebug?.scene.activeCamera.rigCameras.length===2",
                            timeout=30000)

def start_server(root):
    server=http.server.ThreadingHTTPServer(("127.0.0.1",0),functools.partial(Handler,directory=str(root)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    return server,f"http://127.0.0.1:{server.server_port}"

def baseline(browser,origin,route):
    page=browser.new_page(viewport={"width":1240,"height":860})
    emulator(page,origin)
    if route.startswith("/#"):
        page.goto(origin+"/",wait_until="domcontentloaded")
        page.evaluate("hash=>{location.hash=hash}",route[2:])
        page.get_by_role("button",name="Preparar VR").click(timeout=45000)
        frame=next(f for f in page.frames if f.url.endswith("/visualizador.html"))
    else:
        page.goto(origin+route,wait_until="domcontentloaded")
        frame=page.main_frame
        frame.locator("#startButton").wait_for(state="visible")
        expect(frame.locator("#startButton")).to_be_enabled(timeout=150000)
        # Original standalone HTML exposes the action via its parent message bridge.
        frame.evaluate("window.postMessage({channel:'safevision',action:'vr'},location.origin)")
    button=frame.locator("#enterVR")
    button.click(timeout=30000)
    expect(button).to_contain_text("Iniciar sessão VR",timeout=30000)
    button.click()
    wait_frames(frame)
    frame.evaluate("""()=>{
      const app=window.__tourDebug;
      window.qaDraws=0;
      app.scene.onAfterRenderObservable.add(()=>window.qaDraws++);
    }""")
    frame.wait_for_function("qaDraws >= 3")
    frame.evaluate("window.__tourDebug.suspended=true")
    # Deliver successive emulated XR frames while scene rendering is gated.
    delta=frame.evaluate("""async()=>{
      const mgr=window.questSession;
      const before=window.qaDraws;
      await new Promise(r=>setTimeout(r,330));
      return window.qaDraws-before;
    }""")
    assert delta==0,delta
    page.close()
    return {"route":route,"stereo_eyes":2,"frames_during_suspension":delta}

def minimal(browser,origin):
    page=browser.new_page(viewport={"width":960,"height":720})
    emulator(page,origin)
    page.route(origin+"/__minimal.html",lambda route:route.fulfill(content_type="text/html",body="""<!doctype html>
      <canvas width=720 height=540></canvas><button disabled>Entrar</button>
      <script src="/clinica/WEB/vendor/babylon.js"></script><script>
      questEmulator.then(async()=>{
        const B=BABYLON, engine=new B.Engine(document.querySelector('canvas')), scene=new B.Scene(engine);
        new B.FreeCamera('start',new B.Vector3(0,1.6,-3),scene);
        new B.HemisphericLight('day',B.Vector3.Up(),scene);
        B.MeshBuilder.CreateGround('floor',{width:12,height:12},scene);
        B.MeshBuilder.CreateBox('cube',{},scene).position.y=.5;
        const xr=await scene.createDefaultXRExperienceAsync({disableDefaultUI:true,disableTeleportation:true,
          disablePointerSelection:true,inputOptions:{doNotLoadControllerMeshes:true}});
        const button=document.querySelector('button');
        button.onclick=()=>xr.baseExperience.enterXRAsync('immersive-vr','local-floor',xr.renderTarget);
        button.disabled=false;
        engine.runRenderLoop(()=>scene.render());
        scene.onAfterRenderObservable.add(()=>{
          const s=xr.baseExperience.sessionManager;
          if(s.inXRFrameLoop && scene.activeCamera===xr.baseExperience.camera){
            const geometry=scene.getActiveMeshes().data.slice(0,scene.getActiveMeshes().length);
            window.minimal={eyes:scene.activeCamera.rigCameras.length,
              geometry:[...new Set(geometry.map(m=>m.name))].sort(),
              controllers:xr.input.controllers.map(c=>c.inputSource.handedness).sort(),
              layer:!!s.session.renderState.baseLayer, babylon:B.Engine.Version};
          }
        });
      });</script>"""))
    page.goto(origin+"/__minimal.html")
    page.get_by_role("button",name="Entrar").click(timeout=30000)
    page.wait_for_function("window.minimal?.eyes===2 && minimal.controllers.length===2")
    result=page.evaluate("window.minimal")
    assert result["controllers"]==["left","right"] and result["layer"],result
    assert {"cube","floor"}.issubset(result["geometry"]),result
    page.evaluate("questSession.end()")
    page.close()
    return result

def screen_without_webxr(browser,origin,route):
    page=browser.new_page(viewport={"width":430,"height":932},has_touch=True,is_mobile=True)
    page.add_init_script("Object.defineProperty(navigator,'xr',{value:undefined})")
    page.goto(origin+route,wait_until="domcontentloaded")
    expect(page.locator("#questStatus")).to_contain_text("Modo de tela disponível",timeout=150000)
    expect(page.locator("#enterVR")).to_be_hidden()
    page.locator("#startButton").tap()
    expect(page.locator("#screenControls")).to_be_visible()
    before=page.evaluate("__tourDebug.nav.camera.position.asArray()")
    page.get_by_role("button",name="Avançar",exact=True).tap()
    page.wait_for_function("p=>__tourDebug.nav.camera.position.asArray().some((x,i)=>i!==1&&Math.abs(x-p[i])>.03)",arg=before)
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    page.close()
    return {"viewport":[430,932],"touch_navigation":True,"vr_button_hidden":True}

def candidate(browser,origin,route="/vr/"):
    page=browser.new_page(viewport={"width":1240,"height":860})
    errors=[]
    page.on("pageerror",lambda exc:errors.append(exc.name))
    emulator(page,origin)
    response=page.goto(origin+route,wait_until="domcontentloaded")
    assert response.status==200,response.status
    if origin.startswith("https://"):
        assert response.headers.get("permissions-policy")=="xr-spatial-tracking=(self)"
    button=page.locator("#enterVR")
    expect(button).to_be_enabled(timeout=150000)
    expect(button).to_have_text("Entrar em VR")
    assert page.evaluate("window===top && isSecureContext")
    page.locator("#startButton").click()
    expect(page.locator("#screenControls")).to_be_visible()
    before=page.evaluate("window.__tourDebug.nav.camera.position.asArray()")
    page.get_by_role("button",name="Avançar",exact=True).click()
    page.wait_for_function("p=>window.__tourDebug.nav.camera.position.asArray().some((x,i)=>i!==1 && Math.abs(x-p[i])>.03)",arg=before)
    page.get_by_role("button",name="Parar",exact=True).click()
    page.locator("#homeButton").click()
    button.click()
    await_event(page,"first-scene-frame")
    rec=diagnostics(page)
    first=next(r for r in rec["events"] if r["event"]=="first-scene-frame")
    assert first["eyes"]==2 and first["tracked"] and first["layerPresent"] and first["activeMeshes"]>0,first
    assert len(first["viewports"])==2 and all(v["width"]>0 for v in first["viewports"]),first
    get_pos="window.__tourDebug.scene.activeCamera.position.asArray()"
    spawn=page.evaluate("__tourDebug.scene.activeCamera.globalPosition.asArray()")
    assert abs(spawn[0]-1.9)<.25 and 1.2<spawn[1]<2 and abs(spawn[2]+5)<.25,spawn
    before=page.evaluate(get_pos)
    rotation="window.__tourDebug.scene.activeCamera.rotationQuaternion.asArray()"
    head_before=page.evaluate(rotation)
    page.evaluate("questDevice.quaternion.set(0,.125,0,Math.sqrt(1-.125**2))")
    page.wait_for_function("p=>window.__tourDebug.scene.activeCamera.rotationQuaternion.asArray().some((x,i)=>Math.abs(x-p[i])>.025)",arg=head_before)
    page.evaluate("questDevice.quaternion.set(0,0,0,1)")
    page.wait_for_function("p=>window.__tourDebug.scene.activeCamera.rotationQuaternion.asArray().every((x,i)=>Math.abs(x-p[i])<.025)",arg=head_before)
    page.evaluate("questDevice.controllers.left.updateAxes('thumbstick',0,-.85)")
    try:
        await_event(page,"left-stick",6000)
    except Exception:
        print(json.dumps({"events":diagnostics(page),"local_xr":page.evaluate("""() => ({
          device:!!questSession, controllers:[...(questSession?.inputSources || [])].map(s=>[s.handedness,s.gamepad.mapping,Array.from(s.gamepad.axes),s.gamepad.connected]), visibility:questSession?.visibilityState, phase:__tourDebug.quest.phase})""" )}),flush=True)
        raise
    page.wait_for_function("p=>window.__tourDebug.scene.activeCamera.position.asArray().some((x,i)=>i!==1&&Math.abs(x-p[i])>.035)",arg=before)
    page.evaluate("questDevice.controllers.left.updateAxes('thumbstick',0,0)")
    before=page.evaluate(rotation)
    page.evaluate("questDevice.controllers.right.updateAxes('thumbstick',.9,0)")
    await_event(page,"right-stick")
    page.wait_for_function("p=>window.__tourDebug.scene.activeCamera.rotationQuaternion.asArray().some((x,i)=>Math.abs(x-p[i])>.025)",arg=before)
    page.evaluate("questDevice.controllers.right.updateAxes('thumbstick',0,0)")
    # Force exactly the condition under which the published render gate stopped.
    delta=page.evaluate("""async()=>{
      const app=window.__tourDebug;
      let frames=0;
      const ob=app.scene.onAfterRenderObservable.add(()=>frames++);
      app.suspended=true;
      Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
      await new Promise(r=>setTimeout(r,650));
      delete document.hidden;
      app.suspended=false;
      app.scene.onAfterRenderObservable.remove(ob);
      return frames;
    }""")
    assert delta>0,delta
    panel="__tourDebug.scene.getMeshByName('UI_VR_INSPECAO')"
    assert not page.evaluate(panel+".isEnabled()")
    page.evaluate("""()=>{
      questSession.addEventListener('squeezestart',()=>{window.qaGripPressed=true;},{once:true});
      questDevice.controllers.left.updateButtonValue('squeeze',1);
    }""")
    page.wait_for_function("window.qaGripPressed===true")
    page.evaluate("questDevice.controllers.left.updateButtonValue('squeeze', 0)")
    page.wait_for_function(panel+".isEnabled()")
    # The emulator session can end exactly like the browser's own exit command.
    page.evaluate("questSession.end()")
    expect(button).to_have_text("Entrar em VR")
    expect(button).to_be_enabled()
    expect(page.locator("#hud")).to_be_visible()
    button.click()
    page.wait_for_function("""JSON.parse(localStorage.getItem('safevision:quest:diagnostico:v1')).events.filter(r=>r.event==='first-scene-frame').length===2""")
    page.evaluate("questSession.end()")
    expect(button).to_have_text("Entrar em VR")
    expect(button).to_be_enabled()
    page.evaluate("""()=>{
      window.qaRequest=navigator.xr.requestSession;
      navigator.xr.requestSession=()=>Promise.reject(new DOMException('QA', 'NotAllowedError'));
    }""")
    button.click()
    await_event(page,"entry-rejected")
    expect(button).to_have_text("Tentar entrar em VR")
    expect(button).to_be_enabled()
    page.evaluate("()=>{navigator.xr.requestSession=window.qaRequest;}")
    button.click()
    page.wait_for_function("""JSON.parse(localStorage.getItem('safevision:quest:diagnostico:v1')).events.filter(r=>r.event==='first-scene-frame').length===3""")
    page.evaluate("""()=>{
      const scene=__tourDebug.scene,render=scene.render;
      scene.render=function(...args){scene.render=render;throw new Error('Controlled interruption');};
    }""")
    await_event(page,"failure")
    expect(button).to_have_text("Tentar entrar em VR")
    expect(button).to_be_enabled()
    page.locator("#questDiagnostic summary").click()
    expect(page.locator("#questOutput")).to_have_value(re.compile("first-scene-frame"))
    data=diagnostics(page)
    assert len([r for r in data["events"] if r["event"]=="xr-session-ended"])==3
    assert any(r.get("reason")=="scene-render" for r in data["events"])
    page.reload(wait_until="domcontentloaded")
    expect(button).to_be_enabled(timeout=150000)
    page.locator("#questDiagnostic summary").click()
    expect(page.locator("#questOutput")).to_have_value(re.compile(r'"anterior".*scene-render',re.S))
    assert not errors,errors
    page.screenshot(path=EVIDENCE/"quest-return.png")
    page.close()
    return {"diagnostic":data,"frames_while_hidden_and_suspended":delta,
            "three_sessions":True,"screen_controls":True,"head_tracking":True,
            "rejection_and_frame_failure_recovered":True,"previous_diagnostics_after_reload":True,
            "panel_opened_with_grip":True,"spawn":spawn,"browser":browser.version}

def main():
    server,origin=start_server(ROOT/"dist")
    hosted=os.getenv("SAFEVISION_QUEST_HOST")
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path=os.environ["CHROME_PATH"],args=["--enable-unsafe-swiftshader"])
            results={}
            if not hosted and os.getenv("SAFEVISION_QUEST_SKIP_BASE")!="1":
                archive=os.getenv("SAFEVISION_QUEST_ARCHIVE")
                if archive:
                    archive_server,archive_origin=start_server(Path(archive))
                    with archive_server:
                        results["archive"]=baseline(browser,archive_origin,"/WEB/index.html")
                        print(json.dumps(results["archive"]),flush=True)
                        archive_server.shutdown()
                for route in ("/clinica/WEB/index.html","/visualizador.html","/#explorar?de=inicio"):
                    results[route]=baseline(browser,origin,route)
                    print(json.dumps(results[route]),flush=True)
            if not hosted and os.getenv("SAFEVISION_QUEST_SKIP_MINIMAL")!="1":
                results["minimal"]=minimal(browser,origin)
                print(json.dumps(results["minimal"]),flush=True)
            route="/vr/index.html" if hosted else "/vr/"
            results["/vr/"]=candidate(browser,hosted or origin,route)
            results["screen_without_webxr"]=screen_without_webxr(browser,hosted or origin,route)
            (EVIDENCE/"quest-browser.json").write_text(json.dumps(results,ensure_ascii=False,indent=2)+"\n","utf8")
            print(json.dumps({k:v for k,v in results["/vr/"].items() if k!="diagnostic"}),flush=True)
            browser.close()
    finally:
        server.shutdown()
        server.server_close()

if __name__=="__main__":
    main()

"""Common loopback browser and evidence recorder for the Demonstration Edition."""
import json
import os
from contextlib import contextmanager
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright
import platform_fixture as fixture

@contextmanager
def session(suite):
    folder = Path(os.environ.get("M16_EVIDENCE", Path(__file__).resolve().parents[1] / "docs/evidencias-missao-16")) / suite
    folder.mkdir(parents=True, exist_ok=True)
    fixture.start()
    try:
        with sync_playwright() as pw:
            options = {"executable_path": os.environ["CHROME_PATH"]} if os.getenv("CHROME_PATH") else {"channel": "chrome"}
            browser = pw.chromium.launch(**options,args=["--enable-unsafe-swiftshader"])
            page = browser.new_page(viewport={"width":1440,"height":900})
            page.set_default_timeout(15000)
            errors, external, shots = [], [], []
            def restrict(route):
                if urlsplit(route.request.url).netloc != urlsplit(fixture.origin).netloc:
                    external.append(urlsplit(route.request.url).hostname)
                    return route.abort()
                route.continue_()
            page.route("http*/**",restrict)
            page.route(fixture.origin+"/config.json",lambda route:route.fulfill(json={}))
            page.on("pageerror",lambda e:errors.append(str(e)))
            def shot(name, mode="visitante"):
                path = folder / (name+".jpg")
                page.screenshot(path=path,quality=77,animations="disabled")
                shots.append(dict(file=path.name,route=urlsplit(page.url).fragment,
                                  viewport=page.viewport_size,mode=mode,state=name,
                                  environment="Chrome local isolado",browser=browser.version))
            result = {}
            yield page, fixture.origin, shot, result
            assert not errors and not external,(errors,external)
            result.update(browser=browser.version,errors=errors,external=external,captures=shots)
            (folder/"result.json").write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n","utf8")
            print(json.dumps({k:v for k,v in result.items() if k!="captures"},ensure_ascii=True))
            browser.close()
    finally:
        fixture.server.shutdown()

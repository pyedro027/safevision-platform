"""Exercise the built Studio and original viewer using the official local PDFs."""
import argparse
from collections import Counter
import functools
import hashlib
import http.server
import json
from pathlib import Path
import threading
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


def test(page, origin, pdfs, evidence):
    requests = []
    errors = []
    http_errors = []
    console_errors = []
    page.on("request", lambda req: requests.append((req.method, req.url)))
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("response", lambda response: http_errors.append(response.status) if response.status >= 400 else None)
    page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
    page.goto(origin)
    expect(page.get_by_role("heading", name="Visão geral")).to_be_visible()
    studio_link = page.get_by_role("link", name="SAFEVISION Studio", exact=True)
    studio_link.focus()
    page.keyboard.press("Enter")
    expect(page.get_by_role("heading", name="SAFEVISION Studio")).to_be_visible()
    expect(studio_link).to_have_attribute("aria-current", "page")
    page.screenshot(path=evidence / "01-studio.png", full_page=True)
    page.set_viewport_size({"width": 375, "height": 780})
    assert page.evaluate("document.documentElement.scrollWidth === innerWidth")
    page.screenshot(path=evidence / "02-studio-mobile.png", full_page=True)
    page.set_viewport_size({"width": 1350, "height": 920})

    picker = page.locator("#studio-files")
    prepare = page.get_by_role("button", name="Preparar demonstração")
    demo = page.get_by_role("button", name="Experimentar Clínica ÁUREA")
    cancel = page.get_by_role("button", name="Cancelar", exact=True)
    expect(prepare).to_be_disabled()
    picker.focus()
    with page.expect_file_chooser() as chooser:
        page.keyboard.press("Space")
    chooser.value.set_files(pdfs[0])
    expect(page.get_by_text("Selecione também o outro PDF")).to_be_visible()
    expect(prepare).to_be_disabled()
    picker.dispatch_event("cancel")
    expect(page.get_by_role("button", name=f"Remover {pdfs[0].name}")).to_be_visible()

    def clear():
        page.get_by_role("button", name="Limpar seleção").click()
        expect(prepare).to_be_disabled()

    picker.set_input_files(pdfs[0])
    expect(page.get_by_text("Remova uma das cópias", exact=False)).to_have_count(2)
    page.get_by_role("button", name=f"Remover {pdfs[0].name}").first.click()
    expect(page.get_by_text("Selecione também o outro PDF")).to_be_visible()
    clear()

    def payload(name, data):
        return {"name": name, "mimeType": "application/pdf", "buffer": data}

    picker.set_input_files(payload("<b>externo</b>.pdf", b"%PDF-"))
    expect(page.get_by_text("<b>externo</b>.pdf", exact=True)).to_be_visible()
    expect(page.get_by_text("O conjunto não foi reconhecido")).to_be_visible()
    expect(prepare).to_be_disabled()
    clear()
    picker.set_input_files(payload("planta.dwg", b"exemplo"))
    expect(page.get_by_text("Selecione um PDF oficial.", exact=False)).to_be_visible()
    clear()
    picker.set_input_files(payload(pdfs[0].name, b"x" * 252207))
    expect(page.get_by_text("Arquivo acima do limite", exact=False)).to_be_visible()
    clear()
    picker.set_input_files(payload(pdfs[0].name, b"%PDF-" + b"x" * (pdfs[0].stat().st_size - 5)))
    expect(page.get_by_text("Conteúdo diferente do PDF oficial.", exact=False)).to_be_visible()
    clear()
    picker.set_input_files([payload(file.name, file.read_bytes()) for file in pdfs]
                           + [payload("outro.pdf", b"%PDF-")])
    expect(page.get_by_text("Selecione até 2 PDFs", exact=False)).to_be_visible()
    expect(page.get_by_role("list", name="Arquivos selecionados").locator("li")).to_have_count(0)

    # Drop the real fixture bytes through the same DataTransfer interface as Chrome.
    page.locator(".studio-drop").evaluate("""(zone, files) => {
      const dt = new DataTransfer();
      for (const {name, bytes} of files) {
        dt.items.add(new File([Uint8Array.from(bytes)], name, { type: 'application/pdf' }));
      }
      zone.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: dt }));
    }""", [{"name": f.name, "bytes": list(f.read_bytes())} for f in pdfs])
    expect(prepare).to_be_enabled()
    expect(page.get_by_text("Conjunto oficial identificado")).to_be_visible()
    page.screenshot(path=evidence / "03-pdfs-verificados.png", full_page=True)
    page.evaluate("""() => {
      const progress = document.querySelector('.studio-progress progress');
      window.studioSteps = [];
      new MutationObserver(() => window.studioSteps.push(progress.value))
        .observe(progress, { attributes: true, attributeFilter: ['value'] });
    }""")

    # Fail a real fetch and retry. Stall a segment once to record cancellation.
    manifest = "**/clinica/MODELO/model-manifest.json"
    segment = "**/clinica/MODELO/clinica-v03-00.bin"
    retry = page.get_by_role("button", name="Tentar novamente")
    page.route(manifest, lambda route: route.fulfill(status=503, body="indisponível"), times=1)
    prepare.click()
    expect(page.get_by_role("heading", name="Não foi possível preparar a Clínica ÁUREA")).to_be_visible()
    page.screenshot(path=evidence / "04-falha-recuperavel.png", full_page=True)
    pending = []
    def hold_segment(route):
        pending.append(route)
    page.route(segment, hold_segment, times=1)
    retry.click()
    expect(page.get_by_role("heading", name="Preparando a Clínica ÁUREA")).to_be_visible()
    expect(page.locator(".studio-frame iframe")).to_have_count(1)
    if not pending:
        page.wait_for_event("request", predicate=lambda req: req.url.endswith("clinica-v03-00.bin"), timeout=30_000)
    page.screenshot(path=evidence / "05-processamento.png", full_page=True)
    cancel.click()
    expect(page.locator(".studio-frame iframe")).to_have_count(0)
    expect(prepare).to_be_enabled()
    page.unroute(segment, hold_segment)
    page.route(segment, lambda route: route.abort("internetdisconnected"), times=3)
    prepare.click()
    expect(retry).to_be_visible(timeout=35_000)
    expect(page.get_by_role("alert")).to_contain_text("Falha ao carregar")
    errors.clear()
    http_errors.clear()
    console_errors.clear()
    successful_load_start = len(requests)

    retry.click()
    finished = page.get_by_role("heading", name="Demonstração de modelagem 3D concluída")
    expect(finished).to_be_visible(timeout=150_000)
    expect(finished).to_be_focused()
    expect(page.get_by_text("PDFs oficiais identificados no navegador", exact=False)).to_be_visible()
    assert set(page.evaluate("window.studioSteps")) >= {1, 2, 3, 5}
    page.screenshot(path=evidence / "06-conclusao.png", full_page=True)
    runtime = page.frame(url=lambda url: url.endswith("/clinica/WEB/index.html"))
    assert runtime.evaluate("window.__tourDebug.ready && window.__tourDebug.suspended")
    expect(page.locator(".studio-frame iframe")).to_have_count(1)

    page.get_by_role("button", name="Abrir ambiente 3D").click()
    frame = page.frame_locator(".studio-frame iframe")
    expect(frame.locator("#startButton")).to_be_visible()
    frame.locator("#screenMode").check()
    frame.locator('.presentation-entry [data-quality=desktop]').select_option("low")
    frame.locator("#startButton").click()
    position = lambda: runtime.evaluate("window.__tourDebug.nav.snapshot().position")
    before = position()
    frame.get_by_role("button", name="Avançar", exact=True).click()
    runtime.wait_for_function(
        "p => window.__tourDebug.nav.snapshot().position[0] !== p[0]", arg=before, timeout=5000)
    frame.locator("#screenStop").click()
    frame.locator("#tour").focus()
    before = position()
    page.keyboard.down("w")
    try:
        runtime.wait_for_function("p => window.__tourDebug.nav.snapshot().position.some((v,i) => i < 2 && Math.abs(v-p[i]) > .02)", arg=before, timeout=5000)
    finally:
        page.keyboard.up("w")
    canvas = frame.locator("#tour").bounding_box()
    view = runtime.evaluate("window.__tourDebug.nav.snapshot().rotation")
    x, y = canvas["x"] + canvas["width"] * .7, canvas["y"] + canvas["height"] * .43
    page.mouse.move(x, y)
    page.mouse.down()
    page.mouse.move(x + 55, y + 12, steps=8)
    page.mouse.up()
    assert runtime.evaluate("window.__tourDebug.nav.snapshot().rotation") != view
    assert runtime.evaluate("""() => {
      const {model, nav} = window.__tourDebug;
      const door = model.doors.find(item => item.id === 'DOOR_P03_PIVO');
      if (!model.operateDoor(door, nav.camera.position)) return false;
      model.updateDoors(1);
      return door.fraction === 1;
    }""")
    assert runtime.evaluate("""() => {
      const {nav, model, scene} = window.__tourDebug;
      const B = window.BABYLON;
      const test = new B.FreeCamera('qa-studio', new B.Vector3(17.2, 1.65, -5.2), scene);
      test.setTarget(new B.Vector3(17.2, 1.65, -6.2));
      nav.player.position.y = .85;
      for (let i=0; i<180; i++) nav.moveXR(test, 1, 0, 1/60);
      const blocked = test.position.x > 17.2 && test.position.x < 17.61;
      test.dispose();
      nav.teleport(model.safeSpawn(model.config.rooms[0]));
      return blocked;
    }""")
    for index in range(1, 6):
        code = f"R0{index}"
        page.get_by_role("button", name="Voltar ao Studio").click()
        page.get_by_role("button", name=code, exact=False).click()
        runtime.wait_for_function("code => window.__tourDebug.inspection.selected === code", arg=code)
        for state in ("CORR", "PROB"):
            frame.locator(f"#riskContent [data-state={state}]").click()
            assert runtime.evaluate("c => window.__tourDebug.model.states[c]", code) == state
    page.screenshot(path=evidence / "07-inspecao-r05.png", full_page=True)
    page.get_by_role("button", name="Voltar ao Studio").click()
    page.get_by_role("button", name="Repetir demonstração").click()
    expect(finished).to_be_visible()
    assert page.frame(url=lambda url: url.endswith("/clinica/WEB/index.html")) is runtime
    counts = Counter(urlsplit(url).path for _, url in requests[successful_load_start:])
    assert all(counts[f"/clinica/MODELO/clinica-v03-0{index}.bin"] == 1 for index in range(7))

    # Verify the served payloads independently; these requests do not create a second WebGL scene.
    manifest_data = page.request.get(origin + "/clinica/MODELO/model-manifest.json").json()
    digest = hashlib.sha256()
    size = 0
    for part in manifest_data["parts"]:
        response = page.request.get(origin + "/clinica/MODELO/" + part["file"])
        data = response.body()
        assert response.ok and len(data) == part["size"]
        assert hashlib.sha256(data).hexdigest() == part["sha256"]
        size += len(data)
        digest.update(data)
        response.dispose()
    assert size == 113018368 and digest.hexdigest() == manifest_data["sha256"]
    page.get_by_role("link", name="Voltar ao dashboard").click()
    expect(page.locator(".studio-frame iframe")).to_have_count(0)
    studio_link.click()
    demo.click()
    expect(finished).to_be_visible(timeout=150_000)
    expect(page.get_by_text("demonstração sem arquivos selecionados", exact=False)).to_be_visible()
    assert not errors and not http_errors and not console_errors, (errors, http_errors, console_errors)
    network = [(method, url) for method, url in requests if urlsplit(url).scheme in ("http", "https")]
    violations = [(method, url) for method, url in network if method != "GET" or not url.startswith(origin + "/")]
    assert not violations, violations
    assert not page.request.get(origin + "/config.json").json()
    return {"interface": "passed", "official_pdfs": len(pdfs), "request_methods": ["GET"],
            "same_origin_only": True, "external_api_calls": 0, "failure_and_retry": "passed",
            "single_scene_on_repeat": True, "initial_segment_requests": 7,
            "risk_states": ["R01", "R02", "R03", "R04", "R05"], "glb_bytes": size,
            "glb_sha256": digest.hexdigest(), "page_errors": errors, "console_errors": console_errors,
            "unexpected_http_errors": http_errors}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf_dir", type=Path, help="Diretório dos dois PDFs oficiais da Etapa 6")
    parser.add_argument("evidence", type=Path)
    parser.add_argument("--chrome", required=True)
    args = parser.parse_args()
    args.evidence.mkdir(parents=True, exist_ok=True)
    root = Path(__file__).resolve().parents[1]
    handler = functools.partial(QuietHandler, directory=root / "dist")
    with http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler) as server:
        threading.Thread(target=server.serve_forever, daemon=True).start()
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(executable_path=args.chrome, args=["--enable-unsafe-swiftshader"])
            page = browser.new_page(viewport={"width": 1350, "height": 920})
            pdfs = [args.pdf_dir / f"SAFEVISION_V03_{name}.pdf" for name in ("PLANTAS_2D", "DETALHE_TECNICO_R03")]
            report = test(page, f"http://127.0.0.1:{server.server_port}", pdfs, args.evidence)
            report["browser"] = browser.version
            (args.evidence / "qa-studio-demo.json").write_text(json.dumps(report, indent=2) + "\n", "utf-8")
            print(json.dumps(report))
            browser.close()
        server.shutdown()


if __name__ == "__main__":
    main()

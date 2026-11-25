"""Exercise the integrated tour with the seven real GLB parts and a guest profile."""
from time import monotonic
from playwright.sync_api import expect
from edition_fixture import session

with session("visualizador") as (page,origin,shot,result):
    segments = []
    page.on("request",lambda req:segments.append(req.url) if req.url.endswith(".bin") else None)
    def go(hash_):
        page.goto(origin+"/#"+hash_)
    def el(selector):
        return page.frame_locator(".studio-frame iframe").locator(selector)
    def tool(name):
        return page.locator('[data-tool="'+name+'"]')
    for route in ("conta","projetos"):
        go(route)
        expect(page.locator("h1")).to_be_visible()
        expect(page.locator("iframe")).to_have_count(0)
    assert not segments
    go("explorar/R09?de=https://example.invalid")
    expect(page.get_by_text("Caso desconhecido")).to_be_visible()
    expect(tool("back")).to_have_text("Voltar à clínica")
    expect(page.locator(".viewer-loading a")).to_have_count(5)
    shot("caso-desconhecido")
    pattern="**/model-manifest.json"
    page.route(pattern,lambda r:r.fulfill(status=503,body=""))
    go("explorar?de=inicio")
    expect(page.get_by_text("Modelo indisponível")).to_be_visible()
    shot("falha-e-retentativa")
    page.unroute(pattern)
    start=monotonic()
    page.get_by_text("Tentar novamente",exact=True).click()
    shot("carregamento-apos-retentativa")
    expect(el("#startButton")).to_be_enabled(timeout=150000)
    expect(tool("vr")).to_be_enabled(timeout=150000)
    result["ready_seconds"]=round(monotonic()-start,2)
    shot("entrada-integrada")
    tool("focus").click()
    expect(tool("focus")).to_have_attribute("aria-pressed","true")
    page.keyboard.press("Escape")
    expect(tool("focus")).to_have_attribute("aria-pressed","false")
    if tool("full").is_visible():
        tool("full").click()
        page.wait_for_function("!!document.fullscreenElement")
        shot("tela-cheia")
        tool("full").click()
        page.wait_for_function("!document.fullscreenElement")
        result["fullscreen"]="Chrome headless"
    el("#screenMode").check()
    el("#startButton").click()
    expect(el("#hud")).to_be_visible()
    shot("exploracao")
    el("#roomsButton").click()
    expect(el("#roomList [data-room]")).to_have_count(21)
    shot("ambientes")
    el("#roomList [data-room=A04]").click()
    expect(el("#roomsPanel")).to_be_hidden()
    el("#homeButton").click()
    expect(el("#roomName")).to_contain_text("Recepção")
    el("#cleanButton").click()
    expect(el("#cleanButton")).to_have_attribute("aria-pressed","true")
    shot("arquitetura-limpa")
    el("#pauseButton").click()
    el("#settings summary").click()
    expect(el("#invertY")).to_be_visible()
    shot("pausa-configuracoes")
    el("#resumeButton").click()
    el("#risksButton").click()
    frame=page.frames[-1]
    for i in range(1,6):
        code=f"R0{i}"
        el("[data-risk="+code+"]").click()
        for state in ("CORR","PROB"):
            el("[data-state="+state+"]").click()
            assert frame.evaluate("c=>window.__tourDebug.model.states[c]",code)==state
            shot(code+"-"+state)
        expect(el("#review-case")).to_have_attribute("href",origin+"/#inspecoes/"+code)
    expect(el("#technicalLabel")).to_be_visible()
    widths=[(375,812),(430,932),(768,1024),(1024,768),(1440,900),(1920,1080),(844,390)]
    for width,height in widths:
        page.set_viewport_size({"width":width,"height":height})
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"),width
        frame.wait_for_function("document.documentElement.scrollWidth <= innerWidth",timeout=2500)
        expect(tool("back")).to_be_in_viewport()
        if width in (375,844,1920):
            shot("tela-"+str(width))
    page.set_viewport_size({"width":1440,"height":900})
    assert len(segments)==7,len(segments)
    el("#review-case").click()
    expect(page.locator("h1")).to_contain_text("R05")
    expect(page.locator("iframe")).to_have_count(0)
    go("inspecoes/R03")
    field=page.get_by_label("Observações",exact=True)
    field.fill("Observação temporária do teste")
    page.get_by_role("link",name="Visualizar R03 em 3D").click()
    expect(el("#riskContent")).to_be_visible(timeout=150000)
    tool("back").click()
    expect(field).to_have_value("Observação temporária do teste")
    shot("retorno-rascunho")
    page.once("dialog",lambda dialog:dialog.dismiss())
    with page.expect_event("dialog"):
        page.locator('nav a[href="#inicio"]').click()
    page.wait_for_function("location.hash === '#inspecoes/R03'")
    expect(field).to_have_value("Observação temporária do teste")
    page.once("dialog",lambda dialog:dialog.accept())
    with page.expect_event("dialog"):
        page.locator('nav a[href="#inicio"]').click()
    expect(page.locator("h1")).to_have_text("Visão geral")
    go("inspecoes/R03")
    expect(field).to_have_value("")
    result.update(first_load_segments=7,cases=5,states_per_case=2,rooms=21,dimensions=widths,
                  draft_return="preserved",discard="confirmed",retry="passed")

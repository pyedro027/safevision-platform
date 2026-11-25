"""Demonstration outline, privacy, guest mode and SDK session with local HTTP fixtures."""
from playwright.sync_api import expect
from edition_fixture import session
import platform_fixture as api

with session("apresentacao") as (page,origin,shot,result):
    def go(route):
        page.goto(origin+"/#"+route)
    def button(action):
        return page.locator('[data-guide="'+action+'"]')
    go("apresentacao")
    expect(button("start")).to_be_visible()
    shot("00-inicio")
    button("start").click()
    for step in range(1,11):
        expect(page.locator(".guide-copy small")).to_contain_text(f"Etapa {step} de 10")
        if step==2:
            page.reload()
            expect(page.locator(".guide-copy small")).to_contain_text("Etapa 2")
            page.locator('.guide-copy .button').click()
            expect(page.locator("h1")).to_have_text("Visão geral")
            page.locator(".return-guide").click()
        if step==7:
            expect(page.locator(".guide-cases a")).to_have_count(5)
            page.locator(".guide-cases a").nth(2).click()
            expect(page.frame_locator("iframe").locator("#riskContent")).to_be_visible(timeout=150000)
            page.get_by_role("button",name="Retomar apresentação").click()
        if step in (8,9):
            page.locator(".guide-copy .button").click()
            expect(page.locator("h1")).to_be_visible()
            page.locator(".return-guide").click()
        shot("etapa-"+str(step).zfill(2))
        button("next").click()
    expect(page.locator("h1")).to_have_text("Apresentação concluída")
    shot("11-encerramento")
    button("start").click()
    button("exit").click()
    expect(page.locator("h1")).to_have_text("Visão geral")
    for pattern in ("/config.json","/auth/v1/**","/rest/v1/**"):
        page.route(origin+pattern,api.simulated_api)
    go("conta")
    page.reload()
    page.get_by_label("E-mail",exact=True).fill(api.user["email"])
    page.get_by_label("Senha",exact=True).fill("test-password-123")
    page.get_by_role("button",name="Entrar",exact=True).click()
    expect(page.locator("#account-link")).to_have_text(api.user["email"])
    go("apresentacao")
    before=list(api.requests)
    button("start").click()
    button("next").click()
    page.locator(".guide-copy .button").click()
    expect(page.locator("#account-link")).to_have_text("Conta")
    assert api.user["email"] not in page.locator("body").inner_text()
    shot("visao-geral-privacidade","conta QA simulada")
    page.locator(".return-guide").click()
    button("exit").click()
    expect(page.locator("#account-link")).to_have_text(api.user["email"])
    writes=[p for m,p in api.requests[len(before):] if m not in ("GET","HEAD","OPTIONS")]
    assert not writes,writes
    result.update(steps=10,guest="passed",authenticated="simulated",private_header="masked",
                  guide_writes=len(writes),refresh="passed",resume="passed")

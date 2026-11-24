"""Mission 15 UI acceptance. Chrome and vendored SDK, simulated loopback services."""
import json
import os
from pathlib import Path
from urllib.parse import urlsplit
from uuid import uuid4

from playwright.sync_api import expect, sync_playwright

import platform_fixture as api

out = Path(os.environ.get("M15_EVIDENCE", Path(__file__).resolve().parents[1] / "docs/evidencias-missao-15"))
out.mkdir(parents=True, exist_ok=True)
widths = (375, 430, 768, 1024, 1440, 1920)
manifest = []
api.start()
try:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=os.environ["CHROME_PATH"])
        context = browser.new_context(viewport={"width":1440,"height":950})
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda err: errors.append(str(err)))
        for pattern in ("/config.json","/auth/v1/**","/rest/v1/**"):
            context.route(api.origin + pattern,api.simulated_api)

        def go(route):
            page.goto(api.origin + "/#" + route)

        def btn(label):
            return page.get_by_role("button",name=label,exact=True)

        def widths_check():
            original = page.viewport_size
            for width in widths:
                page.set_viewport_size({"width":width,"height":875})
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (page.url,width)
                if page.locator("dialog[open]").count():
                    assert page.locator("dialog").evaluate("el => el.clientWidth >= el.scrollWidth")
            page.set_viewport_size(original)

        def shot(name, auth="visitante"):
            page.screenshot(path=out/(name+".png"),animations="disabled")
            manifest.append(dict(file=name+".png",route=urlsplit(page.url).fragment,
                viewport=page.viewport_size,environment="Chrome local · API simulada",identity=auth))

        def login():
            page.get_by_label("E-mail",exact=True).fill(api.user["email"])
            page.get_by_label("Senha",exact=True).fill("test-password-123")
            btn("Entrar").click()

        go("projetos")
        page.get_by_text("Entre na sua conta").click()
        expect(btn("Entrar")).to_be_visible()
        widths_check()
        shot("01-login-desktop")
        page.set_viewport_size({"width":375,"height":812})
        shot("02-login-mobile")
        page.set_viewport_size({"width":1440,"height":950})
        btn("Mostrar").focus()
        page.keyboard.press("Enter")
        expect(page.locator("#auth-password")).to_have_attribute("type","text")
        btn("Ocultar").click()
        btn("Entrar").click()
        assert page.locator("#auth-email").evaluate("e=>!e.validity.valid")
        btn("Criar conta").click()
        widths_check()
        shot("03-cadastro")
        btn("Voltar ao login").click()
        btn("Esqueci a senha").click()
        widths_check()
        shot("04-recuperacao")
        btn("Voltar ao login").click()
        page.get_by_label("E-mail",exact=True).fill(api.user["email"])
        page.get_by_label("Senha",exact=True).fill("invalid")
        btn("Entrar").click()
        expect(page.locator("#feedback")).to_contain_text("incorretos")
        shot("05-erro-credenciais")
        go("projetos")
        expect(page.get_by_text("Entre na sua conta")).to_be_visible()
        shot("07-projetos-visitante")
        page.get_by_text("Entre na sua conta").click()
        login()
        expect(page.get_by_text("Você ainda não tem projetos.")).to_be_visible()
        shot("08-projetos-vazio","A simulada")
        go("conta")
        expect(btn("Salvar perfil")).to_be_enabled()
        widths_check()
        shot("06-perfil","A simulada")
        go("projetos")
        btn("Novo projeto").click()
        widths_check()
        shot("14-novo-projeto","A simulada")
        assert not page.evaluate("performance.getEntriesByType('resource').some(r=>r.name.includes('/MODELO/'))")
        page.get_by_label("Nome do projeto").fill("Unidade administrativa")
        page.get_by_label("Descrição").fill("Revisão dos acessos e das salas de atendimento.")
        shot("15-novo-preenchido","A simulada")
        delayed = []
        write_pattern = api.origin+"/rest/v1/projects**"
        page.route(write_pattern,lambda route: delayed.append(route) if route.request.method == "POST" else api.simulated_api(route))
        btn("Criar projeto").click()
        expect(page.locator('form[data-form="project"]')).to_have_attribute("aria-busy","true")
        expect(btn("Aguarde…")).to_be_disabled()
        page.locator('form[data-form="project"]').evaluate("form=>form.requestSubmit()")
        assert len(delayed) == 1
        api.simulated_api(delayed.pop())
        page.unroute(write_pattern)
        expect(page.locator("#feedback")).to_contain_text("Projeto salvo")
        shot("16-criacao-confirmada","A simulada")
        for title, description in (("Clínica odontológica", "Organização do pavimento térreo."),
                ("Edificação residencial","Revisão das circulações.")):
            btn("Novo projeto").click()
            page.get_by_label("Nome do projeto").fill(title)
            page.get_by_label("Descrição").fill(description)
            btn("Criar projeto").click()
            expect(page.get_by_role("link",name=title,exact=True)).to_be_visible()
        widths_check()
        shot("09-projetos-grade","A simulada")
        page.locator(".project-demo").scroll_into_view_if_needed()
        shot("25-demonstracao-separada","A simulada")
        btn("Lista").click()
        widths_check()
        shot("10-projetos-lista","A simulada")
        page.locator("#project-search").fill("clinica")
        expect(page.locator(".project-record")).to_have_count(1)
        shot("11-pesquisa","A simulada")
        page.locator("#project-search").fill("inexistente")
        shot("12-sem-resultados","A simulada")
        btn("Limpar pesquisa").click()
        page.locator("#project-sort").select_option("name")
        expect(page.locator(".project-record h2").first).to_have_text("Clínica odontológica")
        shot("13-ordenacao","A simulada")
        page.locator("#project-sort").select_option("name-desc")
        expect(page.locator(".project-record h2").first).to_have_text("Unidade administrativa")
        page.set_viewport_size({"width":375,"height":812})
        shot("23-projetos-mobile","A simulada")
        page.get_by_role("link",name="Unidade administrativa").click()
        expect(page.locator(".history")).to_be_visible()
        shot("24-detalhes-mobile","A simulada")
        page.set_viewport_size({"width":1440,"height":950})
        widths_check()
        shot("17-detalhes","A simulada")
        btn("Editar").click()
        page.get_by_label("Descrição").fill("Acessos revisados após a conferência das salas.")
        btn("Salvar alterações").click()
        expect(page.locator(".history li")).to_have_count(2)
        page.locator("#project-history").scroll_into_view_if_needed()
        shot("18-historico","A simulada")
        expect(page.get_by_text("Nenhum modelo associado.")).to_be_visible()
        shot("21-modelo-ausente","A simulada")
        detail_url = page.url
        other = context.new_page()
        other.goto(detail_url)
        expect(other.get_by_role("heading",name="Unidade administrativa",exact=True)).to_be_visible()
        other.close()
        # Simulate an expired SDK session in this disposable browser profile.
        expire = """() => {
            const key = 'safevision-platform-v1';
            const saved = JSON.parse(localStorage.getItem(key));
            saved.expires_at = 1;
            localStorage.setItem(key,JSON.stringify(saved));
        }"""
        page.evaluate(expire)
        page.reload()
        expect(page.locator(".history")).to_be_visible()
        assert api.refresh_count > 0
        btn("Editar").click()
        shot("19-edicao","A simulada")
        page.keyboard.press("Escape")
        expect(btn("Editar")).to_be_focused()
        # Stale revision on the server must preserve the editor and draft.
        target = next(p for p in api.projects if p["id"] == detail_url.split("/")[-1])
        target["updated_at"] = "2026-11-24T20:00:00.123Z"
        btn("Editar").click()
        page.get_by_label("Nome do projeto").fill("Minha revisão pendente")
        btn("Salvar alterações").click()
        expect(page.locator("[data-dialog-status]")).to_contain_text("registro mudou")
        expect(page.get_by_label("Nome do projeto")).to_have_value("Minha revisão pendente")
        btn("Cancelar").click()
        page.reload()
        expect(page.locator(".history")).to_be_visible()
        btn("Excluir").click()
        widths_check()
        expect(btn("Cancelar")).to_be_focused()
        shot("20-confirmacao-exclusao","A simulada")
        btn("Cancelar").click()
        # Retry the same private route after read failures.
        pattern = api.origin+"/rest/v1/projects**"
        # Read failure keeps the retry action available; a failed write keeps unsaved text.
        btn("Editar").click()
        page.get_by_label("Descrição").fill("Nota local não confirmada")
        page.route(pattern,lambda route: route.abort("internetdisconnected"))
        btn("Salvar alterações").click()
        expect(page.locator("[data-dialog-status]")).to_contain_text("Não foi possível",timeout=30000)
        expect(page.get_by_label("Descrição")).to_have_value("Nota local não confirmada")
        page.unroute(pattern)
        btn("Cancelar").click()
        for status in (401,403,404,429,500,503):
            page.route(pattern, lambda route: route.fulfill(status=status,json={"message":"test failure"}))
            page.reload()
            expect(btn("Tentar novamente")).to_be_visible(timeout=30000)
            if status == 503:
                shot("22-falha-de-comunicacao","A simulada")
            page.unroute(pattern)
        btn("Tentar novamente").click()
        expect(page.locator(".history")).to_be_visible()
        page.goto(api.origin+"/?recuperar=1")
        expect(page.get_by_text("O link de recuperação está expirado",exact=False)).to_be_visible()
        expect(page.get_by_label("Nova senha")).to_have_count(0)
        page.get_by_text("Voltar ao login").click()
        lag_tab = context.new_page()
        delayed_history = []
        lag_tab.route(api.origin+"/rest/v1/project_versions**",lambda route: delayed_history.append(route))
        lag_tab.goto(detail_url)
        expect(lag_tab.locator("#project-history")).to_contain_text("Carregando")
        lag_tab.wait_for_function("document.querySelector('#project-history') !== null")
        assert len(delayed_history) == 1
        btn("Sair").click()
        expect(page.locator("#account-link")).to_have_text("Entrar")
        expect(lag_tab.locator("#project-history")).to_have_count(0)
        # Separate authorized fixture identity. SQL ownership is tested independently.
        expect(page.locator(".history")).to_have_count(0)
        api.user = {"id":str(uuid4()),"email":"qa-b@example.invalid"}
        api.profiles.clear()
        page.goto(detail_url)
        page.get_by_text("Entre na sua conta").click()
        login()
        expect(page.get_by_text("Projeto indisponível para esta conta.")).to_be_visible()
        assert not page.locator("#project-history").count()
        from playwright.sync_api import Error as PlaywrightError
        try:
            delayed_history[0].fulfill(status=200,json=[{"title":"Versão anterior particular","recorded_at":api.timestamp}])
        except PlaywrightError as err:
            if "closed" not in str(err) and "abort" not in str(err).lower():
                raise
        expect(lag_tab.get_by_text("Projeto indisponível para esta conta.")).to_be_visible()
        expect(lag_tab.locator("body")).not_to_contain_text("Versão anterior particular")
        lag_tab.close()
        api.refresh_allowed = False
        page.evaluate(expire)
        page.reload()
        expect(page.get_by_text("Entre na sua conta")).to_be_visible(timeout=20000)
        expect(page.locator("#account-link")).to_have_text("Entrar")
        for route,name in (("inicio","26-dashboard"),("studio","27-studio"),("inspecoes","28-inspecoes"),
                ("relatorios","29-relatorios"),("aurea","30-navegacao-demonstrativa")):
            go(route)
            expect(page.locator("h1").first).to_be_visible()
            shot(name)
        assert not errors, errors
        browser.close()
finally:
    api.server.shutdown()
(out/"manifesto.json").write_text(json.dumps(sorted(manifest,key=lambda x:x["file"]),ensure_ascii=False,indent=2)+"\n","utf-8")
print("30 estados capturados com SDK real e serviços simulados; seis larguras e navegação por teclado.")

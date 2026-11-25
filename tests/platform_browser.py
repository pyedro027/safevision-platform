"""Browser regression with the real SDK and a loopback HTTP fixture."""
import os
from pathlib import Path
from uuid import uuid4
from playwright.sync_api import expect, sync_playwright
import platform_fixture as fixture
from platform_fixture import origin, server, simulated_api, user, requests, review_requests, reviews, timestamp

fixture.start()
try:
    with sync_playwright() as playwright:
        options = {"channel": "chrome"}
        if os.getenv("CHROME_PATH"):
            options = {"executable_path": os.environ["CHROME_PATH"]}
        browser = playwright.chromium.launch(**options)
        page = browser.new_page(viewport={"width": 1200, "height": 800})
        def capture(name):
            if os.getenv("REDESIGN_EVIDENCE"):
                page.screenshot(path=Path(os.environ["REDESIGN_EVIDENCE"]) / (name + ".png"), full_page=True)
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(origin)
        expect(page.get_by_role("heading", name="Visão geral")).to_be_visible()
        expect(page.get_by_text("O serviço de contas e projetos ainda não foi configurado")).to_be_visible()
        page.get_by_role("link", name="Abrir demonstração 3D").click()
        expect(page.get_by_role("button", name="Voltar à visão geral")).to_be_visible()
        assert "#explorar?de=inicio" in page.url
        for pattern in ("/config.json", "/auth/v1/**", "/rest/v1/**"):
            page.route(origin + pattern, simulated_api)
        page.goto(origin + "/#conta")
        page.reload()
        capture("09-conta-visitante")
        page.goto(origin + "/#projetos")
        expect(page.get_by_text("para acessar seus projetos privados.", exact=False)).to_be_visible()
        capture("03-projetos-visitante")
        page.goto(origin + "/#conta")
        page.get_by_role("button", name="Criar conta").click()
        page.get_by_label("E-mail").fill(user["email"])
        page.get_by_label("Senha").fill("test-password-123")
        page.get_by_role("button", name="Criar conta").click()
        expect(page.locator("#feedback")).to_contain_text("Verifique seu e-mail")
        page.goto(origin + "/?code=signup-code")
        expect(page.locator("#account-link")).to_have_text(user["email"])
        page.get_by_role("link", name="Conta", exact=True).click()
        page.get_by_role("button", name="Sair", exact=True).click()
        expect(page.locator("#account-link")).to_have_text("Entrar")
        page.get_by_role("link", name="Conta", exact=True).click()
        page.get_by_role("button", name="Esqueci a senha").click()
        page.get_by_label("E-mail").fill(user["email"])
        page.get_by_role("button", name="Recuperar senha").click()
        expect(page.locator("#feedback")).to_contain_text("um link será enviado")
        wrong_browser = browser.new_page()
        for pattern in ("/config.json", "/auth/v1/**", "/rest/v1/**"):
            wrong_browser.route(origin + pattern, simulated_api)
        wrong_browser.goto(origin + "/?recuperar=1&code=recovery-code")
        expect(wrong_browser.get_by_text("O link de recuperação está expirado")).to_be_visible()
        expect(wrong_browser.get_by_label("Nova senha")).to_have_count(0)
        wrong_browser.close()
        page.goto(origin + "/?recuperar=1&code=recovery-code")
        expect(page.get_by_label("Nova senha")).to_be_visible()
        page.get_by_label("Nova senha").fill("test-new-password-456")
        page.get_by_role("button", name="Salvar senha").click()
        expect(page.locator("#feedback")).to_contain_text("Senha atualizada")
        assert "recuperar=" not in page.url and "code=" not in page.url
        page.get_by_role("button", name="Sair", exact=True).click()
        expect(page.locator("#account-link")).to_have_text("Entrar")
        page.get_by_role("link", name="Conta", exact=True).click()
        page.get_by_label("E-mail").fill(user["email"])
        page.get_by_label("Senha").fill("senha-incorreta")
        page.get_by_role("button", name="Entrar").click()
        expect(page.locator("#feedback")).to_contain_text("E-mail ou senha incorretos")
        page.get_by_label("E-mail").fill(user["email"])
        page.get_by_label("Senha").fill("test-password-123")
        page.get_by_role("button", name="Entrar").click()
        page.get_by_role("link", name="Meus projetos", exact=True).click()
        expect(page.get_by_text("Você ainda não tem projetos.")).to_be_visible()
        page.get_by_role("button", name="Novo projeto").click()
        page.get_by_label("Nome do projeto").fill("Projeto <b>QA</b>")
        page.get_by_label("Descrição").fill("Descrição de teste")
        page.get_by_role("button", name="Criar projeto").click()
        expect(page.get_by_role("link", name="Projeto <b>QA</b>")).to_be_visible()
        capture("04-projetos-dados-simulados")
        page.get_by_role("link", name="Projeto <b>QA</b>").click()
        expect(page.get_by_role("heading",name="Histórico do projeto")).to_be_visible()
        page.get_by_role("button", name="Editar").click()
        page.get_by_label("Nome do projeto").fill("Projeto revisado")
        page.get_by_role("button", name="Salvar alterações").click()
        page.reload()
        expect(page.locator("#project-history")).to_contain_text("Projeto <b>QA</b>")
        page.get_by_role("button", name="Excluir", exact=True).click()
        page.get_by_role("button", name="Excluir projeto").click()
        expect(page.get_by_text("Você ainda não tem projetos.")).to_be_visible()
        page.get_by_role("link", name="Conta", exact=True).click()
        page.get_by_label("Nome de exibição").fill("Operador QA")
        page.get_by_role("button", name="Salvar perfil").click()
        expect(page.locator("#feedback")).to_contain_text("Perfil atualizado")
        capture("10-conta-simulada")
        capture("m14-03-conta-simulada")
        page.evaluate("""() => localStorage.setItem('safevision:inspection:v1:guest:aurea-v03:R02',
            JSON.stringify({status:'Em análise',notes:'Rascunho visitante',advice:'',date:new Date().toISOString()}))""")
        page.goto(origin + "/#inspecoes")
        page.get_by_text("Importar rascunhos de visitante").click()
        page.get_by_role("checkbox",name="R02",exact=False).check()
        capture("m14-11-importacao-simulada")
        page.get_by_role("button",name="Cancelar importação").click()
        assert review_requests == []
        page.get_by_text("Importar rascunhos de visitante").click()
        expect(page.get_by_role("checkbox",name="R02",exact=False)).not_to_be_checked()
        page.get_by_role("checkbox",name="R02",exact=False).check()
        page.get_by_role("button",name="Importar selecionados").click()
        expect(page.get_by_text("Local · sincronização pendente")).to_be_visible()
        capture("m14-07-pendente-simulada")
        assert review_requests == []
        sync = page.get_by_role("button",name="Sincronizar avaliações")
        page.evaluate("Object.defineProperty(navigator,'onLine',{configurable:true,value:false})")
        sync.click()
        expect(page.get_by_text("Sem conexão. Os rascunhos pendentes",exact=False)).to_be_visible()
        capture("m14-06-offline-simulada")
        page.evaluate("delete navigator.onLine")
        fixture.fail_reviews = True
        sync.click()
        expect(page.get_by_text("HTTP 503",exact=False)).to_be_visible()
        capture("m14-08-erro-simulado")
        fixture.fail_reviews = False
        sync.click()
        expect(page.get_by_text("Cópia confirmada na nuvem")).to_be_visible()
        assert reviews["R02"]["notes"] == "Rascunho visitante"
        capture("m14-05-confirmacao-simulada")
        page.goto(origin + "/#inspecoes/R02")
        page.get_by_label("Observações",exact=True).fill("Versão deste navegador")
        page.get_by_role("button",name="Salvar rascunho").click()
        reviews["R02"].update(notes="Versão de outro dispositivo",revision=str(uuid4()))
        page.goto(origin + "/#inspecoes")
        sync.click()
        expect(page.get_by_text("Conflito em R02",exact=False)).to_be_visible()
        expect(page.get_by_text("Versão de outro dispositivo",exact=False)).to_be_visible()
        capture("m14-09-conflito-simulado")
        for width in (375,430,768,1024,1440,1920):
            page.set_viewport_size({"width":width,"height":880})
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
            if width == 375:
                capture("m14-13-mobile")
        page.set_viewport_size({"width":1200,"height":800})
        page.get_by_role("button",name="Manter versão da nuvem").click()
        expect(page.get_by_text("Cópia confirmada na nuvem")).to_be_visible()
        page.goto(origin + "/#inspecoes/R02")
        page.get_by_text("Versões preservadas neste navegador").click()
        expect(page.get_by_text("Versão deste navegador",exact=False)).to_be_visible()
        page.goto(origin + "/#relatorios")
        expect(page.get_by_text("Versão de outro dispositivo",exact=True)).to_be_visible()
        capture("m14-12-relatorio-simulado")
        page.goto(origin + "/#conta")
        page.get_by_role("button", name="Sair", exact=True).click()
        expect(page.get_by_role("heading", name="Visão geral")).to_be_visible()
        page.set_viewport_size({"width":390, "height":844})
        page.get_by_role("button", name="Menu", exact=True).click()
        page.get_by_role("link", name="Clínica ÁUREA", exact=True).click()
        expect(page.get_by_role("heading", name="Casos disponíveis")).to_be_visible()
        assert page.evaluate("document.documentElement.scrollWidth === innerWidth")
        assert not errors, errors
        assert ("POST", "/auth/v1/token") in requests
        assert ("DELETE", "/rest/v1/projects") in requests
        if os.getenv("SAFEVISION_QA_SCREENSHOT"):
            page.screenshot(path=os.environ["SAFEVISION_QA_SCREENSHOT"], full_page=True)
        assert ("PUT", "/auth/v1/user") in requests
        print("Chrome: PKCE de cadastro e recuperação, credenciais inválidas, sessão, perfil e CRUD com API simulada.")
        browser.close()
finally:
    server.shutdown()

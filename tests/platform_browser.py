"""Browser checks with a simulated API. Does not contact Supabase or send email."""
import base64
import functools
import http.server
import json
import os
from pathlib import Path
import threading
import time
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright

root = Path(__file__).resolve().parents[1]
server = http.server.ThreadingHTTPServer(
    ("127.0.0.1", 0),
    functools.partial(http.server.SimpleHTTPRequestHandler, directory=root / "dist"),
)
origin = f"http://127.0.0.1:{server.server_port}"
threading.Thread(target=server.serve_forever, daemon=True).start()
timestamp = "2026-11-21T13:00:00.000Z"
user = {"id": "11111111-1111-4111-8111-111111111111", "email": "qa@example.invalid"}
projects = []
history = []
profiles = []
requests = []


def jwt_part(payload):
    return base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")


def simulated_api(route):
    request = route.request
    path = urlsplit(request.url).path
    method = request.method
    requests.append((method, path))
    data = request.post_data_json if request.post_data else {}
    if path == "/config.json":
        response = {"url": origin, "key": "sb_publishable_test_fixture"}
    elif path == "/auth/v1/token":
        assert data["email"] == user["email"]
        assert data["password"] == "test-password-123"
        exp = int(time.time()) + 3600
        token = f"{jwt_part({'alg':'HS256'})}.{jwt_part({'sub':user['id'], 'exp':exp})}.fixture"
        response = {"access_token": token, "refresh_token": "fixture", "token_type": "bearer",
                    "expires_in": 3600, "expires_at": exp, "user": user}
    elif path == "/auth/v1/logout":
        return route.fulfill(status=204, body="")
    elif path == "/auth/v1/signup":
        response = user
    elif path == "/auth/v1/recover":
        assert "recuperar=1" in request.url or "recuperar%3D1" in request.url
        response = {}
    elif path == "/rest/v1/projects":
        if method == "POST":
            assert set(data) == {"title", "description"}
            project = {**data, "id": "22222222-2222-4222-8222-222222222222", "updated_at": timestamp}
            projects.append(project)
            history.append({**data, "recorded_at": timestamp})
            response = project
        elif method == "PATCH":
            assert "id=eq." in request.url
            projects[0].update(data)
            history.insert(0, {**data, "recorded_at": timestamp})
            response = projects[0]
        elif method == "DELETE":
            assert "id=eq." in request.url
            response = projects.pop()
            history.clear()
        else:
            response = projects
    elif path == "/rest/v1/profiles":
        if method in ("POST", "PATCH"):
            profiles[:] = [data]
            response = data
        else:
            response = profiles
    elif path == "/rest/v1/project_versions":
        response = history
    else:
        raise AssertionError((method, path))
    route.fulfill(status=200, json=response)


try:
    with sync_playwright() as playwright:
        options = {"channel": "chrome"}
        if os.getenv("CHROME_PATH"):
            options = {"executable_path": os.environ["CHROME_PATH"]}
        browser = playwright.chromium.launch(**options)
        page = browser.new_page(viewport={"width": 1200, "height": 800})
        errors = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(origin)
        expect(page.get_by_role("heading", name="Visão geral")).to_be_visible()
        expect(page.get_by_text("O serviço de contas e projetos ainda não foi configurado")).to_be_visible()
        page.get_by_role("link", name="Abrir demonstração 3D").click()
        expect(page.get_by_role("button", name="Abrir visualizador 3D")).to_be_visible()
        for pattern in ("/config.json", "/auth/v1/**", "/rest/v1/**"):
            page.route(origin + pattern, simulated_api)
        page.goto(origin + "/#conta")
        page.reload()
        page.get_by_role("button", name="Criar conta").click()
        page.get_by_label("E-mail").fill(user["email"])
        page.get_by_label("Senha").fill("test-password-123")
        page.get_by_role("button", name="Criar conta").click()
        expect(page.locator("#feedback")).to_contain_text("Verifique seu e-mail")
        page.get_by_role("button", name="Esqueci a senha").click()
        page.get_by_label("E-mail").fill(user["email"])
        page.get_by_role("button", name="Recuperar senha").click()
        expect(page.locator("#feedback")).to_contain_text("um link será enviado")
        page.get_by_role("button", name="Voltar ao login").click()
        page.get_by_label("E-mail").fill(user["email"])
        page.get_by_label("Senha").fill("test-password-123")
        page.get_by_role("button", name="Entrar").click()
        page.get_by_role("link", name="Meus projetos", exact=True).click()
        expect(page.get_by_text("Você ainda não tem projetos.")).to_be_visible()
        page.get_by_role("button", name="Novo projeto").click()
        page.get_by_label("Título").fill("Projeto <b>QA</b>")
        page.get_by_label("Descrição").fill("Descrição de teste")
        page.get_by_role("button", name="Salvar projeto").click()
        page.get_by_role("button", name="Projeto <b>QA</b>").click()
        expect(page.get_by_role("dialog")).to_contain_text("Histórico")
        page.get_by_role("button", name="Editar").click()
        page.get_by_label("Título").fill("Projeto revisado")
        page.get_by_role("button", name="Salvar projeto").click()
        page.reload()
        page.get_by_role("button", name="Projeto revisado").click()
        expect(page.get_by_role("dialog")).to_contain_text("Projeto <b>QA</b>")
        page.get_by_role("button", name="Excluir", exact=True).click()
        page.get_by_role("button", name="Excluir projeto").click()
        expect(page.get_by_text("Você ainda não tem projetos.")).to_be_visible()
        page.get_by_role("link", name="Conta", exact=True).click()
        page.get_by_label("Nome de exibição").fill("Operador QA")
        page.get_by_role("button", name="Salvar perfil").click()
        expect(page.locator("#feedback")).to_contain_text("Perfil atualizado")
        page.get_by_role("button", name="Sair", exact=True).click()
        expect(page.get_by_role("heading", name="Visão geral")).to_be_visible()
        page.set_viewport_size({"width":390, "height":844})
        page.get_by_role("link", name="Clínica ÁUREA", exact=True).click()
        expect(page.get_by_role("heading", name="Casos disponíveis")).to_be_visible()
        assert page.evaluate("document.documentElement.scrollWidth === innerWidth")
        assert not errors, errors
        assert ("POST", "/auth/v1/token") in requests
        assert ("DELETE", "/rest/v1/projects") in requests
        if os.getenv("SAFEVISION_QA_SCREENSHOT"):
            page.screenshot(path=os.environ["SAFEVISION_QA_SCREENSHOT"], full_page=True)
        print("Chrome: demonstração, layout móvel, sessão e CRUD de projetos com API simulada.")
        browser.close()
finally:
    server.shutdown()

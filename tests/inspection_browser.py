"""Local browser QA. Run against the built static dashboard on loopback."""
import argparse
import json
from pathlib import Path
from pypdf import PdfReader
from playwright.sync_api import sync_playwright, expect

parser = argparse.ArgumentParser()
parser.add_argument("origin")
parser.add_argument("output", type=Path)
parser.add_argument("--chrome", required=True)
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=args.chrome)
    page = browser.new_page(viewport={"width":1440,"height":950})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    def shot(name):
        page.screenshot(path=args.output / (name+".png"))
    def go(route):
        page.goto(args.origin + "/#" + route)
    go("inicio")
    expect(page.get_by_role("heading",name="Visão geral")).to_be_visible()
    shot("01-dashboard")
    nav = page.get_by_role("link", name="Inspeções",exact=True)
    nav.focus()
    page.keyboard.press("Enter")
    expect(page.get_by_text("0 de 5 avaliados")).to_be_visible()
    shot("02-inspecoes")
    for n in range(1,6):
        code = f"R0{n}"
        go("inspecoes/"+code)
        expect(page.locator("h1")).to_contain_text(code)
        if n in (1,3,5):
            shot(code)
        page.get_by_label("Observações",exact=True).fill("Teste local · "+code)
        page.get_by_label("Status da avaliação").select_option("Avaliado" if n < 3 else "Em análise")
        page.get_by_label("Recomendação complementar").fill("Conferir no projeto.")
        if n == 3:
            shot("formulario")
        page.get_by_role("button",name="Salvar rascunho").click()
        expect(page.locator("#save-message")).to_contain_text("salvo")
    page.reload()
    expect(page.get_by_label("Observações",exact=True)).to_have_value("Teste local · R05")
    page.get_by_label("Observações",exact=True).fill("<b>Texto revisado</b>")
    page.get_by_role("button",name="Salvar rascunho").click()
    shot("salvo-local")
    page.get_by_role("button",name="Visualizar R05 em 3D").click()
    expect(page.locator(".inspection-view p")).to_have_text("Inspeção em 3D · R05",timeout=120000)
    frame=page.frames[-1]
    frame.wait_for_function("window.__tourDebug.inspection.selected === 'R05'")
    for state in ("CORR","PROB"):
        frame.locator(f"#riskContent [data-state={state}]").click()
        assert frame.evaluate("window.__tourDebug.model.states.R05") == state
    shot("visualizador")
    page.get_by_role("button",name="Voltar à ficha").click()
    expect(page.locator("iframe")).to_have_count(0)
    page.get_by_role("link",name="Voltar às inspeções").click()
    expect(page.get_by_text("2 de 5 avaliados")).to_be_visible()
    shot("resumo")
    page.get_by_role("link",name="Visualizar relatório").click()
    expect(page.get_by_text("<b>Texto revisado</b>",exact=True)).to_be_visible()
    shot("relatorio")
    page.evaluate("window.print = () => {window.printRequested = true}")
    page.get_by_role("button",name="Imprimir / salvar como PDF").click()
    assert page.evaluate("window.printRequested")
    page.emulate_media(media="print")
    shot("impressao")
    pdf=args.output/"relatorio-exemplo.pdf"
    page.pdf(path=pdf,prefer_css_page_size=True,print_background=True)
    pages=PdfReader(pdf).pages
    assert len(pages)==6, len(pages)
    for n,p in enumerate(pages):
        assert abs(float(p.mediabox.width)-595)<2 and abs(float(p.mediabox.height)-842)<2
        if n: assert f"R0{n}" in p.extract_text()
    page.emulate_media(media="screen")
    go("inspecoes/R05")
    page.set_viewport_size({"width":375,"height":820})
    expect(page.get_by_label("Observações",exact=True)).to_have_value("<b>Texto revisado</b>")
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    shot("mobile")
    page.once("dialog",lambda d:d.accept())
    page.get_by_role("button",name="Limpar registro R05").click()
    expect(page.get_by_label("Observações",exact=True)).to_have_value("")
    page.evaluate("localStorage.setItem('safevision:inspection:v2:guest:aurea-v03:R05','invalid')")
    page.reload()
    expect(page.get_by_role("alert")).to_contain_text("armazenamento")
    page.once("dialog",lambda d:d.accept())
    page.get_by_role("button",name="Limpar registro R05").click()
    expect(page.get_by_label("Observações",exact=True)).to_have_value("")
    assert not errors, errors
    print(json.dumps({"cases":5,"completed":2,"pdf_a4_pages":len(pages),"browser":browser.version,"page_errors":errors}))
    browser.close()

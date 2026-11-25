"""Serve the built Demonstration Edition only on the local machine."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

dist = Path(__file__).resolve().parents[1] / "dist"
if not (dist / "visualizador.html").is_file():
    raise SystemExit("Gere a distribuição com node scripts/build-platform.mjs.")
try:
    server = ThreadingHTTPServer(("127.0.0.1", 4181), partial(SimpleHTTPRequestHandler, directory=str(dist)))
except OSError as error:
    raise SystemExit("Porta 4181 indisponível. Confira o servidor existente.") from error
with server:
    print("SAFEVISION · http://127.0.0.1:4181/#apresentacao", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass

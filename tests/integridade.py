"""Confere a cópia distribuída da Versão C e o GLB sem extrair um arquivo novo."""
import hashlib
import json
from pathlib import Path

repository = Path(__file__).resolve().parents[1]
viewer = repository / "apps/viewer"
baseline = json.loads((repository / "docs/inventario-versao-c.json").read_text("utf-8"))
expected = {entry["path"]: entry for entry in baseline["files"]}
found = {p.relative_to(viewer).as_posix() for p in viewer.rglob("*") if p.is_file()}
if found != expected.keys():
    raise SystemExit(f"Arquivos divergentes: {sorted(found ^ expected.keys())}")

for name, entry in expected.items():
    data = (viewer / name).read_bytes()
    if len(data) != entry["bytes"] or hashlib.sha256(data).hexdigest() != entry["sha256"]:
        raise SystemExit(f"Conteúdo divergente: {name}")

model = json.loads((viewer / "MODELO/model-manifest.json").read_text("utf-8"))
digest = hashlib.sha256()
size = 0
for part in model["parts"]:
    data = (viewer / "MODELO" / part["file"]).read_bytes()
    if len(data) != part["size"] or hashlib.sha256(data).hexdigest() != part["sha256"]:
        raise SystemExit(f"Segmento divergente: {part['file']}")
    digest.update(data)
    size += len(data)

if size != baseline["glb_bytes"] or digest.hexdigest() != baseline["glb_sha256"]:
    raise SystemExit("GLB recomposto divergente")
print(f"{len(expected)} arquivos verificados. GLB: {size} bytes, SHA-256 {digest.hexdigest()}")

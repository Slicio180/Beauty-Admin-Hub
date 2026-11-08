from pathlib import Path
import base64, hashlib, json
root = Path(__file__).resolve().parent
meta = json.loads((root / "archive.json").read_text())
data = b"".join(base64.b64decode((root / name).read_text(), validate=True) for name in meta["parts"])
if len(data) != meta["bytes"] or hashlib.sha256(data).hexdigest() != meta["sha256"]:
    raise SystemExit("Checkpoint integrity check FAILED")
target = root / meta["archive"]
if target.exists() and target.read_bytes() != data:
    raise SystemExit("Different archive already exists; not overwritten")
target.write_bytes(data)
print("VERIFIED: " + str(target))
print("Extract this tar.xz archive to a new folder; do not overwrite your working project.")

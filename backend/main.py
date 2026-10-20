import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
root_dir = backend_dir.parent
for p in [str(backend_dir), str(root_dir)]:
    if p not in sys.path:
        sys.path.insert(0, p)

try:
    from backend.app.main import app
except ImportError:
    from app.main import app

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)

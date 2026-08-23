import sys
import zipfile
from pathlib import Path


zip_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("..") / "jargon-arena-upload.zip"

with zipfile.ZipFile(zip_path) as archive:
    original_names = [info.orig_filename for info in archive.infolist()]

assert "index.html" in original_names, original_names
assert all("\\" not in name for name in original_names), original_names
assert all(not name.startswith(("/", "\\")) for name in original_names), original_names

print(f"ZIP PATH TEST PASSED: {len(original_names)} entries use safe relative slash paths")

from pathlib import Path
text = Path("about.html").read_text(encoding="utf-8")
non_ascii = sorted({ch for ch in text if ord(ch) > 127})
print(non_ascii)

from pathlib import Path
text = Path("about.html").read_text(encoding="utf-8")
text = text.replace('- Survey prompt', '— Survey prompt').replace('-every', '—every')
Path("about.html").write_text(text, encoding="utf-8")

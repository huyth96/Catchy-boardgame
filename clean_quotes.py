from pathlib import Path
text = Path("about.html").read_text(encoding="utf-8")
text = text.replace('\u201d', '"').replace('\u201c', '"').replace('\u2014', '-').replace('\u2019', "'").replace('\u2018', "'")
Path("about.html").write_text(text, encoding="utf-8")

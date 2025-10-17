from pathlib import Path
text = Path("about.html").read_text(encoding="utf-8")
lines = text.splitlines()
new_lines = []
for line in lines:
    if '<li>' in line:
        stripped = line.strip()
        stripped = stripped.replace('<li>', '').replace('</li>', '').strip()
        new_lines.append('          ' + stripped)
    else:
        new_lines.append(line)
Path("about.html").write_text('\n'.join(new_lines), encoding="utf-8")

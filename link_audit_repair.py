#!/usr/bin/env python3
from pathlib import Path
from urllib.parse import urlsplit
from bs4 import BeautifulSoup
from collections import defaultdict
from datetime import datetime
import zipfile, shutil, sys

ROOT = Path.cwd()
BACKUP = ROOT / f"link-audit-backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}.zip"
REPORT = ROOT / "link-audit-report.txt"

# 1) Back up only files this repair will touch.
files_to_backup = []
for fp in ROOT.rglob('*.html'):
    try:
        if 'href="/contact.html"' in fp.read_text(errors='ignore'):
            files_to_backup.append(fp)
    except Exception:
        pass
idx = ROOT / 'index.html'
if idx.exists() and idx not in files_to_backup:
    files_to_backup.append(idx)

with zipfile.ZipFile(BACKUP, 'w', zipfile.ZIP_DEFLATED) as z:
    for fp in files_to_backup:
        z.write(fp, fp.relative_to(ROOT))

# 2) Repair the known site-wide broken Contact Us target.
changed = 0
for fp in ROOT.rglob('*.html'):
    try:
        s = fp.read_text(errors='ignore')
    except Exception:
        continue
    ns = s.replace('href="/contact.html"', 'href="/profile.html"')
    if ns != s:
        fp.write_text(ns)
        changed += 1

# 3) Repair the four analytical decision cards on the homepage if they are still plain divs.
idx = ROOT / 'index.html'
if idx.exists():
    s = idx.read_text(errors='ignore')
    old = '''  <div class="tool-grid">\n    <div class="tool"><strong>Min-Max & Reorder Point</strong><small>Lead demand · Safety stock · ROP</small><b>ROP = Lead Demand + Safety Stock</b></div>\n    <div class="tool"><strong>EOQ / Order Quantity</strong><small>Demand · Ordering cost · Carrying cost</small><b>EOQ = √(2DS / H)</b></div>\n    <div class="tool"><strong>Inventory Turnover</strong><small>Consumption · Average inventory</small><b>Turnover = Annual Consumption / Avg. Inventory</b></div>\n    <div class="tool"><strong>ABC / FSN Analysis</strong><small>Value · Movement · Criticality</small><b>Classify → Prioritize → Control</b></div>\n  </div>'''
    new = '''  <div class="tool-grid">\n    <a class="tool" href="/tools/inventory/min-max-calculator.html"><strong>Min-Max & Reorder Point</strong><small>Lead demand · Safety stock · ROP</small><b>ROP = Lead Demand + Safety Stock</b></a>\n    <a class="tool" href="/tools/inventory/eoq-calculator.html"><strong>EOQ / Order Quantity</strong><small>Demand · Ordering cost · Carrying cost</small><b>EOQ = √(2DS / H)</b></a>\n    <a class="tool" href="/tools/inventory/turnover-calculator.html"><strong>Inventory Turnover</strong><small>Consumption · Average inventory</small><b>Turnover = Annual Consumption / Avg. Inventory</b></a>\n    <a class="tool" href="/tools/inventory/abc-analyzer.html"><strong>ABC / FSN Analysis</strong><small>Value · Movement · Criticality</small><b>Classify → Prioritize → Control</b></a>\n  </div>'''
    if old in s:
        idx.write_text(s.replace(old, new))
        print('Homepage analytical cards: repaired (4 cards now clickable).')
    else:
        print('Homepage analytical cards: already repaired or structure differs; no change made.')

# 4) Full internal-link audit.
broken = defaultdict(list)
checked = 0
html_count = 0
for fp in ROOT.rglob('*.html'):
    html_count += 1
    try:
        soup = BeautifulSoup(fp.read_text(errors='ignore'), 'html.parser')
    except Exception:
        continue
    for tag in soup.find_all(['a','area'], href=True):
        h = tag.get('href','').strip()
        if not h:
            continue
        u = urlsplit(h)
        if h.startswith(('#','mailto:','tel:','javascript:','data:')) or u.scheme or u.netloc:
            continue
        path = u.path or '/'
        target = (ROOT / path.lstrip('/')) if path.startswith('/') else (fp.parent / path)
        target = target.resolve()
        checked += 1
        if not (target.is_file() or target.is_dir()):
            txt = ' '.join(tag.get_text(' ', strip=True).split())
            broken[h].append((str(fp.relative_to(ROOT)), txt))

lines = [
    'INDUSTRIAL MATERIALS MANAGEMENT — INTERNAL LINK AUDIT',
    '=' * 60,
    f'HTML files scanned: {html_count}',
    f'Internal links checked: {checked}',
    f'Files changed for /contact.html repair: {changed}',
    f'Backup created: {BACKUP.name}',
    f'Unique broken targets after repair: {len(broken)}',
    f'Broken link occurrences after repair: {sum(map(len, broken.values()))}',
    ''
]
if broken:
    lines.append('BROKEN TARGETS')
    lines.append('-' * 40)
    for h, refs in sorted(broken.items()):
        lines.append(f'{h} ({len(refs)} references)')
        for f,t in refs[:10]:
            lines.append(f'  {f} | {t[:100]}')
else:
    lines.append('RESULT: PASS — all internal HTML links resolve to a file or directory.')

REPORT.write_text('\n'.join(lines))
print('\n'.join(lines))
sys.exit(1 if broken else 0)

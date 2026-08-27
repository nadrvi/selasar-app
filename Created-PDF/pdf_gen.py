#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import sys
import re
from pathlib import Path

try:
    from fpdf import FPDF
except:
    os.system("pip install fpdf2 -q")
    from fpdf import FPDF

BASE_PATH = Path(__file__).parent
FILES = ["DOCUMENTATION_INDEX.md", "EXECUTIVE_SUMMARY.md", "SYSTEM_DOCUMENTATION.md",
         "QUICK_REFERENCE.md", "ARCHITECTURE_DIAGRAMS.md", "IMPLEMENTATION_CHECKLIST.md"]
OUTPUT = BASE_PATH / "SELASAR_COMPLETE_DOCUMENTATION.pdf"


def read_file(fp):
    try:
        return open(fp, encoding='utf-8').read()
    except:
        return ""


def clean(t):
    t = re.sub(r'[^\x00-\x7F]+', '', t)
    t = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', t)
    t = re.sub(r'!\[.*?\]\([^\)]*\)', '', t)
    t = re.sub(r'<!--.*?-->', '', t, flags=re.DOTALL)
    t = re.sub(r'\n\n\n+', '\n\n', t)
    return t.strip()


print("="*50)
print("SELASAR PDF Generator")
print("="*50)

print("\nReading files...")
content = ""
for i, f in enumerate(FILES, 1):
    fp = BASE_PATH / f
    d = read_file(fp)
    if d:
        if i > 1:
            content += "\n\n---\n\n"
        content += d
        print(f"  {i}. {f}: OK")
    else:
        print(f"  {i}. {f}: SKIP")

content = clean(content)
print(f"Total: {len(content)} chars")

print("\nGenerating PDF...")
pdf = FPDF(format='A4', orientation='P', unit='mm')
pdf.set_auto_page_break(auto=True, margin=15)
pdf.add_page()

pdf.set_font("Helvetica", "B", 24)
pdf.set_text_color(89, 74, 66)
pdf.cell(0, 20, "SELASAR", align="C", new_x="LMARGIN", new_y="NEXT")

pdf.set_font("Helvetica", "B", 14)
pdf.cell(0, 10, "Complete System Documentation",
         align="C", new_x="LMARGIN", new_y="NEXT")

pdf.set_font("Helvetica", "", 10)
pdf.cell(0, 15, "Workspace Discovery Platform",
         align="C", new_x="LMARGIN", new_y="NEXT")

pdf.ln(10)
pdf.set_font("Helvetica", "", 9)
pdf.set_text_color(0, 0, 0)

for line in content.split('\n'):
    try:
        if not line.strip():
            pdf.ln(2)
        elif line.startswith('# '):
            pdf.ln(3)
            pdf.set_font("Helvetica", "B", 13)
            pdf.set_text_color(89, 74, 66)
            text = line[2:].strip()[:150]
            pdf.cell(0, 7, text, new_x="LMARGIN", new_y="NEXT")
            pdf.set_font("Helvetica", "", 9)
            pdf.set_text_color(0, 0, 0)
        elif line.startswith('## '):
            pdf.ln(1)
            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(139, 107, 79)
            text = line[3:].strip()[:150]
            pdf.cell(0, 5, text, new_x="LMARGIN", new_y="NEXT")
            pdf.set_font("Helvetica", "", 9)
            pdf.set_text_color(0, 0, 0)
        elif line.startswith('### '):
            pdf.set_font("Helvetica", "B", 10)
            text = line[4:].strip()[:150]
            pdf.cell(0, 4, text, new_x="LMARGIN", new_y="NEXT")
            pdf.set_font("Helvetica", "", 9)
        elif line.startswith('- '):
            text = line[2:].strip()[:160]
            if text:
                pdf.cell(10, 3, "", new_x="LMARGIN", new_y="NEXT")
                pdf.cell(5, 3, "", new_x="RIGHT", new_y="TOP")
                pdf.cell(0, 3, text[:155], new_x="LMARGIN", new_y="NEXT")
        elif line.startswith('---'):
            pdf.ln(2)
            pdf.set_draw_color(180, 140, 110)
            pdf.line(20, pdf.get_y(), 190, pdf.get_y())
            pdf.ln(2)
        elif len(line.strip()) > 5:
            text = line.strip()[:170]
            pdf.set_font("Helvetica", "", 9)
            pdf.cell(0, 3, text, new_x="LMARGIN", new_y="NEXT")
    except Exception as e:
        pass

pdf.output(str(OUTPUT))
size = os.path.getsize(OUTPUT) / (1024*1024)

print(f"\nSuccess!")
print(f"  File: {OUTPUT}")
print(f"  Size: {size:.2f} MB")
print("="*50)

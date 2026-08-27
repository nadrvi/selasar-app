#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
SELASAR - Create Combined PDF Documentation
Menggabungkan markdown files menjadi satu PDF
"""

import os
import sys
from pathlib import Path
import re

# Install fpdf2 if needed
try:
    from fpdf import FPDF
except ImportError:
    print("Installing fpdf2...")
    os.system("pip install fpdf2 -q")
    from fpdf import FPDF

BASE_PATH = Path(__file__).parent
FILES_TO_COMBINE = [
    "DOCUMENTATION_INDEX.md",
    "EXECUTIVE_SUMMARY.md",
    "SYSTEM_DOCUMENTATION.md",
    "QUICK_REFERENCE.md",
    "ARCHITECTURE_DIAGRAMS.md",
    "IMPLEMENTATION_CHECKLIST.md",
]
OUTPUT_PDF = BASE_PATH / "SELASAR_COMPLETE_DOCUMENTATION.pdf"


def read_file(filepath):
    """Read markdown file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        print(f"  Error: {e}")
        return None


def clean_text(text):
    """Remove non-ASCII characters and markdown syntax"""
    # Remove emoji and special unicode
    text = re.sub(r'[^\x00-\x7F]+', '', text)
    # Remove markdown links
    text = re.sub(r'\[([^\]]+)\]\(([^\)]+)\)', r'\1', text)
    # Remove markdown images
    text = re.sub(r'!\[([^\]]*)\]\(([^\)]+)\)', '', text)
    # Remove html comments
    text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)
    # Clean extra whitespace
    text = re.sub(r'\n\n\n+', '\n\n', text)
    return text


def create_pdf():
    """Create PDF from markdown files"""
    print("\nReading markdown files...")
    content = ""

    for i, filename in enumerate(FILES_TO_COMBINE, 1):
        filepath = BASE_PATH / filename
        print(f"  [{i}/{len(FILES_TO_COMBINE)}] {filename}...", end=" ")

        data = read_file(filepath)
        if data:
            if i > 1:
                content += "\n\n" + "="*80 + "\n\n"
            content += data
            print("OK")
        else:
            print("SKIP")

    # Clean content
    print("\nProcessing content...")
    content = clean_text(content)

    # Create PDF
    print("Generating PDF...")
    pdf = FPDF()
    pdf.add_page()

    # Title page
    pdf.set_font("Helvetica", "B", 28)
    pdf.set_text_color(89, 74, 66)
    pdf.cell(0, 30, "SELASAR", new_x="LMARGIN", new_y="NEXT", align="C")

    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "Complete System Documentation",
             new_x="LMARGIN", new_y="NEXT", align="C")

    pdf.set_font("Helvetica", "", 12)
    pdf.cell(0, 10, "Workspace Discovery Platform",
             new_x="LMARGIN", new_y="NEXT", align="C")

    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 30, "August 2026", new_x="LMARGIN", new_y="NEXT", align="C")

    # Add content
    pdf.add_page()
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(0, 0, 0)

    lines = content.split('\n')
    for line in lines:
        line = line[:190]  # Truncate long lines

        if not line.strip():
            pdf.ln(2)
        elif line.startswith('# '):
            pdf.ln(3)
            pdf.set_font("Helvetica", "B", 14)
            pdf.set_text_color(89, 74, 66)
            pdf.cell(0, 6, line[2:].strip(), new_x="LMARGIN", new_y="NEXT")
            pdf.set_font("Helvetica", "", 9)
            pdf.set_text_color(0, 0, 0)
            pdf.ln(1)
        elif line.startswith('## '):
            pdf.ln(2)
            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(139, 107, 79)
            pdf.cell(0, 5, line[3:].strip(), new_x="LMARGIN", new_y="NEXT")
            pdf.set_font("Helvetica", "", 9)
            pdf.set_text_color(0, 0, 0)
        elif line.startswith('### '):
            pdf.set_font("Helvetica", "B", 10)
            pdf.cell(0, 4, line[4:].strip(), new_x="LMARGIN", new_y="NEXT")
            pdf.set_font("Helvetica", "", 9)
        elif line.startswith('- ') or line.startswith('* '):
            pdf.cell(10, 3, "")
            pdf.multi_cell(0, 3, line[2:].strip())
        elif line.startswith('---'):
            pdf.ln(2)
            pdf.set_draw_color(139, 107, 79)
            pdf.line(20, pdf.get_y(), 190, pdf.get_y())
            pdf.ln(2)
        else:
            if len(line.strip()) > 3:
                try:
                    pdf.multi_cell(0, 3, line.strip())
                except:
                    pass

    # Save PDF
    try:
        pdf.output(str(OUTPUT_PDF))
        size = os.path.getsize(OUTPUT_PDF) / (1024 * 1024)
        print(f"\nSuccess!")
        print(f"  Output: {OUTPUT_PDF}")
        print(f"  Size: {size:.2f} MB")
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False


if __name__ == "__main__":
    print("="*60)
    print("  SELASAR - PDF Documentation Generator")
    print("="*60)

    success = create_pdf()

    print("="*60)
    if success:
        print("PDF Creation Completed!")
    else:
        print("PDF Creation Failed!")
    print("="*60)

    sys.exit(0 if success else 1)

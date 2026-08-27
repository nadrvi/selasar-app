#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
SELASAR - Create Combined PDF Documentation using FPDF2
Menggabungkan 5 markdown files menjadi satu PDF terpadu
"""

import os
import sys
from pathlib import Path
import re

# Try to import required libraries
try:
    from fpdf import FPDF
except ImportError:
    print("Installing required package: fpdf2...")
    os.system("pip install fpdf2 -q")
    from fpdf import FPDF

# File paths
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


def read_markdown_file(filepath):
    """Read markdown file and return content"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print(f"⚠️  File not found: {filepath}")
        return None
    except Exception as e:
        print(f"❌ Error reading {filepath}: {e}")
        return None


def clean_markdown_for_pdf(content):
    """Clean markdown syntax for PDF"""
    # Remove emoji and special unicode characters
    content = re.sub(r'[^\x00-\x7F]+', '', content)

    # Remove markdown images
    content = re.sub(r'!\[([^\]]*)\]\(([^\)]+)\)', r'[Image: \1]', content)

    # Remove HTML comments
    content = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)

    # Clean excessive whitespace
    content = re.sub(r'\n\n\n+', '\n\n', content)

    return content


def combine_markdown_files():
    """Combine all markdown files into one"""
    print("📖 Combining markdown files...")
    combined_content = ""

    # Combine files
    for i, filename in enumerate(FILES_TO_COMBINE, 1):
        filepath = BASE_PATH / filename
        print(f"  [{i}/{len(FILES_TO_COMBINE)}] Reading {filename}...", end=" ")

        content = read_markdown_file(filepath)
        if content:
            # Add separator (except for first file)
            if i > 1:
                combined_content += "\n\n" + "="*80 + "\n\n"

            combined_content += content
            print("✅")
        else:
            print("⏭️  Skipped")

    return combined_content


def markdown_to_pdf(content, output_path):
    """Convert markdown content to PDF using FPDF"""
    print("🔄 Processing markdown and generating PDF...")

    # Create PDF
    pdf = FPDF(orientation='P', unit='mm', format='A4')
    pdf.add_page()

    # Set colors (Selasar brand)
    pdf.set_text_color(89, 74, 66)  # Main color

    # Title page
    pdf.set_font("Arial", "B", 28)
    pdf.cell(0, 30, "SELASAR", ln=True, align="C")
    pdf.set_font("Arial", "B", 16)
    pdf.cell(0, 10, "Complete System Documentation", ln=True, align="C")
    pdf.set_font("Arial", "", 12)
    pdf.cell(0, 10, "Workspace Discovery Platform", ln=True, align="C")
    pdf.set_font("Arial", "", 10)
    pdf.cell(0, 30, "August 2026", ln=True, align="C")

    # Add separator
    pdf.ln(10)
    pdf.set_draw_color(139, 107, 79)  # Accent color
    pdf.line(20, pdf.get_y(), 190, pdf.get_y())

    pdf.ln(10)
    pdf.set_font("Arial", "", 9)
    pdf.cell(0, 5, "This document contains comprehensive system documentation",
             ln=True, align="C")
    pdf.cell(0, 5, "including executive summary, technical specifications, and implementation checklist", ln=True, align="C")

    # Add page break
    pdf.add_page()

    # Table of Contents
    pdf.set_font("Arial", "B", 14)
    pdf.cell(0, 10, "Table of Contents", ln=True)
    pdf.set_font("Arial", "", 10)

    toc_items = [
        "Documentation Index",
        "Executive Summary",
        "System Documentation",
        "Quick Reference",
        "Architecture Diagrams",
        "Implementation Checklist"
    ]

    for i, item in enumerate(toc_items, 1):
        pdf.cell(0, 6, f"{i}. {item}", ln=True)

    # Clean content
    content = clean_markdown_for_pdf(content)

    # Process content line by line
    pdf.add_page()
    pdf.set_font("Arial", "", 10)

    lines = content.split('\n')
    for line in lines:
        if not line.strip():
            pdf.ln(2)
            continue

        # Detect headers
        if line.startswith('# '):
            pdf.ln(5)
            pdf.set_font("Arial", "B", 16)
            pdf.set_text_color(89, 74, 66)
            pdf.multi_cell(0, 8, line[2:].strip())
            pdf.set_font("Arial", "", 10)
            pdf.set_text_color(0, 0, 0)
            pdf.ln(2)
        elif line.startswith('## '):
            pdf.ln(3)
            pdf.set_font("Arial", "B", 13)
            pdf.set_text_color(139, 107, 79)
            pdf.multi_cell(0, 7, line[3:].strip())
            pdf.set_font("Arial", "", 10)
            pdf.set_text_color(0, 0, 0)
            pdf.ln(1)
        elif line.startswith('### '):
            pdf.ln(2)
            pdf.set_font("Arial", "B", 11)
            pdf.set_text_color(139, 107, 79)
            pdf.multi_cell(0, 6, line[4:].strip())
            pdf.set_font("Arial", "", 10)
            pdf.set_text_color(0, 0, 0)
            pdf.ln(1)
        elif line.startswith('- ') or line.startswith('* '):
            # List item
            pdf.set_x(pdf.get_x() + 5)
            pdf.multi_cell(0, 5, line[2:].strip())
        elif line.startswith('---'):
            # Separator
            pdf.set_draw_color(139, 107, 79)
            pdf.line(20, pdf.get_y() + 2, 190, pdf.get_y() + 2)
            pdf.ln(5)
        elif line.startswith('|'):
            # Table row - simplified
            row = line.split('|')[1:-1]
            for cell in row:
                pdf.cell(40, 5, cell.strip()[:40], border=1)
            pdf.ln()
        elif line.startswith('```') or line.startswith('```'):
            # Code block - just skip the markers
            continue
        else:
            # Regular paragraph
            if len(line.strip()) > 3:
                pdf.multi_cell(0, 5, line.strip())
                pdf.ln(1)

    # Add footer with metadata
    pdf.add_page()
    pdf.set_font("Arial", "B", 12)
    pdf.cell(0, 10, "Document Information", ln=True)
    pdf.set_font("Arial", "", 10)
    pdf.ln(2)
    pdf.cell(0, 5, "Generated: August 18, 2026", ln=True)
    pdf.cell(0, 5, f"Total Files Combined: {len(FILES_TO_COMBINE)}", ln=True)
    pdf.cell(0, 5, "Format: PDF", ln=True)
    pdf.ln(5)
    pdf.cell(0, 5, "Files Included:", ln=True)
    for filename in FILES_TO_COMBINE:
        pdf.cell(10, 4, "", border=0)
        pdf.cell(0, 4, f"• {filename}", ln=True)

    pdf.ln(10)
    pdf.set_font("Arial", "", 9)
    pdf.cell(0, 4, "SELASAR - Workspace Discovery Platform", ln=True, align="C")
    pdf.cell(0, 4, "Repository: d:\\coding\\selasar-app", ln=True, align="C")
    pdf.cell(0, 4, "Status: Active Development", ln=True, align="C")

    # Save PDF
    try:
        pdf.output(str(output_path))
        return True
    except Exception as e:
        print(f"❌ Error saving PDF: {e}")
        return False


def main():
    """Main function"""
    print("\n" + "="*60)
    print("  SELASAR - PDF Documentation Generator")
    print("  Using FPDF2 Library")
    print("="*60 + "\n")

    # Step 1: Combine markdown files
    markdown_content = combine_markdown_files()

    if not markdown_content:
        print("\n❌ Failed to combine markdown files")
        return False

    print(
        f"✅ Combined {len(FILES_TO_COMBINE)} files ({len(markdown_content)} characters)")

    # Step 2: Convert markdown to PDF
    success = markdown_to_pdf(markdown_content, OUTPUT_PDF)

    if success:
        file_size = os.path.getsize(OUTPUT_PDF) / \
            (1024 * 1024)  # Convert to MB
        print(f"\n📍 Output file: {OUTPUT_PDF}")
        print(f"📊 File size: {file_size:.2f} MB")
        print("\n" + "="*60)
        print("✨ Documentation PDF creation completed!")
        print("="*60 + "\n")
        return True
    else:
        print("\n❌ Failed to generate PDF")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

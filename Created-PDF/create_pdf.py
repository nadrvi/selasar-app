#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
SELASAR - Create Combined PDF Documentation
Menggabungkan 5 markdown files menjadi satu PDF terpadu
"""

import os
import sys
from pathlib import Path

# Try to import required libraries
try:
    from fpdf import FPDF
    import textwrap
except ImportError:
    print("Installing required packages...")
    os.system("pip install fpdf2 -q")
    from fpdf import FPDF
    import textwrap

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

# Custom CSS for PDF styling (not used with FPDF2)
PDF_CSS = """
FPDF2 generates PDF directly without CSS
"""


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


def combine_markdown_files():
    """Combine all markdown files into one"""
    print("📖 Combining markdown files...")
    combined_content = ""

    # Add header
    combined_content += """
# 📚 SELASAR - COMPLETE SYSTEM DOCUMENTATION

**Version:** 1.0.0  
**Date:** August 2026  
**Status:** Active Development  
**Format:** Combined PDF Documentation  

---

## 📋 Table of Contents

1. [Documentation Index](#dokumentasi-index)
2. [Executive Summary](#executive-summary)
3. [System Documentation](#sistem-dokumentasi)
4. [Quick Reference](#quick-reference)
5. [Architecture Diagrams](#arsitektur-diagrams)
6. [Implementation Checklist](#implementasi-checklist)

---

"""

    # Combine files
    for i, filename in enumerate(FILES_TO_COMBINE, 1):
        filepath = BASE_PATH / filename
        print(f"  [{i}/{len(FILES_TO_COMBINE)}] Reading {filename}...", end=" ")

        content = read_markdown_file(filepath)
        if content:
            # Add page break (except for first file)
            if i > 1:
                combined_content += "\n\n---\n\n"

            combined_content += content
            print("✅")
        else:
            print("⏭️  Skipped")

    # Add footer
    combined_content += f"""

---

## 📄 Document Information

**Generated:** 2026-08-18  
**Total Files Combined:** {len(FILES_TO_COMBINE)}  
**Format:** PDF  
**Page Count:** Auto-generated  

**Files Included:**
"""

    for filename in FILES_TO_COMBINE:
        combined_content += f"\n- {filename}"

    combined_content += """

---

**Project:** SELASAR - Workspace Discovery Platform  
**Repository:** d:\\coding\\selasar-app  

*This is a complete, consolidated documentation package for the entire SELASAR system.*
"""

    return combined_content


def convert_markdown_to_html(markdown_content):
    """Convert markdown to HTML with proper styling"""
    print("🔄 Converting markdown to HTML...")
    html_content = markdown(markdown_content, extensions=[
                            'tables', 'fenced_code', 'codehilite'])

    # Wrap with proper HTML structure
    full_html = f"""<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SELASAR - Complete System Documentation</title>
    {PDF_CSS}
</head>
<body>
    {html_content}
    <div class="footer">
        <p>SELASAR - Workspace Discovery Platform</p>
        <p>Complete System Documentation - August 2026</p>
    </div>
</body>
</html>"""

    return full_html


def generate_pdf(html_content, output_path):
    """Generate PDF from HTML"""
    print("📄 Generating PDF...")
    try:
        HTML(string=html_content).write_pdf(output_path)
        print(f"✅ PDF generated successfully!")
        return True
    except Exception as e:
        print(f"❌ Error generating PDF: {e}")
        return False


def main():
    """Main function"""
    print("\n" + "="*60)
    print("  SELASAR - PDF Documentation Generator")
    print("="*60 + "\n")

    # Step 1: Combine markdown files
    markdown_content = combine_markdown_files()

    if not markdown_content:
        print("\n❌ Failed to combine markdown files")
        return False

    # Step 2: Convert to HTML
    html_content = convert_markdown_to_html(markdown_content)

    # Step 3: Generate PDF
    success = generate_pdf(html_content, OUTPUT_PDF)

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

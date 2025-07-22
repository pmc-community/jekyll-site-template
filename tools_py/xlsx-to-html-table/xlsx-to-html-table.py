#!/usr/bin/env python3

import sys
import html
from openpyxl import load_workbook
from openpyxl.utils import range_boundaries

def get_hex_color(cell):
    """Return hex color from cell fill (if any)."""
    fill = cell.fill
    if fill and fill.fill_type == "solid":
        color = fill.fgColor
        if color.type == "rgb" and color.rgb:
            return f"#{color.rgb[-6:]}"  # Remove alpha if present
    return None

def table_range_to_html(ws, cell_range):
    min_col, min_row, max_col, max_row = range_boundaries(cell_range)
    html_rows = ['<table border="1" cellspacing="0" cellpadding="4">']

    for row in ws.iter_rows(min_row=min_row, max_row=max_row,
                            min_col=min_col, max_col=max_col):
        html_rows.append('  <tr>')
        for cell in row:
            # Value: Use cached formula result if needed
            value = cell.value if not cell.data_type == "f" else cell._value
            cell_value = html.escape(str(value)) if value is not None else ''

            # Background color
            bg_color = get_hex_color(cell)
            style = f' style="background-color:{bg_color}"' if bg_color else ''

            html_rows.append(f'    <td{style}>{cell_value}</td>')
        html_rows.append('  </tr>')

    html_rows.append('</table>')
    return '\n'.join(html_rows)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 xlsx-to-html-table.py <file.xlsx> <range> [sheet_name]", file=sys.stderr)
        print("Example: python3 xlsx-to-html-table.py file.xlsx B2:D10 Sheet1", file=sys.stderr)
        sys.exit(1)

    file_path = sys.argv[1]
    cell_range = sys.argv[2]
    sheet_name = sys.argv[3] if len(sys.argv) > 3 else None

    wb = load_workbook(filename=file_path, data_only=True)
    ws = wb[sheet_name] if sheet_name else wb.active

    html_output = table_range_to_html(ws, cell_range)
    print(html_output)

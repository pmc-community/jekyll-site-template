#!/usr/bin/env python3

import sys
import os
from openpyxl import load_workbook
from openpyxl.utils import range_boundaries
import plotly.graph_objects as go
import openpyxl.chart.bar_chart
import openpyxl.chart.pie_chart
import openpyxl.chart.line_chart

logShow = False  # Set to True to enable debug logging

def log(*args, **kwargs):
    if logShow:
        print(*args, file=sys.stderr, **kwargs)

def extract_chart_title(chart):
    title = chart.title
    if title is None:
        return None
    if isinstance(title, str):
        return title.strip()
    try:
        if hasattr(title, 'tx') and hasattr(title.tx, 'rich') and hasattr(title.tx.rich, 'p'):
            if title.tx.rich.p and len(title.tx.rich.p) > 0 and hasattr(title.tx.rich.p[0], 'r'):
                if title.tx.rich.p[0].r and len(title.tx.rich.p[0].r) > 0 and hasattr(title.tx.rich.p[0].r[0], 't'):
                    return title.tx.rich.p[0].r[0].t.strip()
        elif hasattr(title, 'strRef') and hasattr(title.strRef, 'f'):
            return None
        return None
    except Exception as e:
        log(f"  Warning: Could not parse chart title: {e}")
        return None

def parse_range(sheet, ref):
    if '!' in ref:
        ref = ref.split('!')[1]
    ref = ref.replace('$', '')

    try:
        min_col, min_row, max_col, max_row = range_boundaries(ref)
    except Exception as e:
        log(f"  Warning: Could not parse range '{ref}': {e}")
        return []

    values = []
    if (max_row - min_row + 1) >= (max_col - min_col + 1):  # Vertical
        for row_idx in range(min_row, max_row + 1):
            cell = sheet.cell(row=row_idx, column=min_col)
            values.append(cell.value)
    else:  # Horizontal
        for col_idx in range(min_col, max_col + 1):
            cell = sheet.cell(row=min_row, column=col_idx)
            values.append(cell.value)
    return values

def extract_axis_titles(sheet, chart):
    category_axis_title = None
    value_axis_title = None

    try:
        if hasattr(chart, 'x_axis') and chart.x_axis and chart.x_axis.title:
            if isinstance(chart.x_axis.title, str):
                category_axis_title = chart.x_axis.title
            elif hasattr(chart.x_axis.title, 'tx') and hasattr(chart.x_axis.title.tx, 'rich'):
                p = chart.x_axis.title.tx.rich.p
                if p and hasattr(p[0], 'r') and p[0].r and hasattr(p[0].r[0], 't'):
                    category_axis_title = p[0].r[0].t

        if hasattr(chart, 'y_axis') and chart.y_axis and chart.y_axis.title:
            if isinstance(chart.y_axis.title, str):
                value_axis_title = chart.y_axis.title
            elif hasattr(chart.y_axis.title, 'tx') and hasattr(chart.y_axis.title.tx, 'rich'):
                p = chart.y_axis.title.tx.rich.p
                if p and hasattr(p[0], 'r') and p[0].r and hasattr(p[0].r[0], 't'):
                    value_axis_title = p[0].r[0].t
    except Exception as e:
        log(f"  Warning: Could not extract axis titles: {e}")

    return category_axis_title, value_axis_title

def extract_chart_data(filename, sheet_name, chart_title):
    if not os.path.isfile(filename):
        sys.exit(0)

    wb = load_workbook(filename, data_only=True)

    if sheet_name not in wb.sheetnames:
        log(f"Error: Sheet '{sheet_name}' not found in workbook.")
        sys.exit(1)

    sheet = wb[sheet_name]
    matched_chart = None

    for chart in sheet._charts:
        title = extract_chart_title(chart)
        log(f"Processing chart: {title or '<No Title>'}")
        if title == chart_title:
            matched_chart = chart
            break

    if not matched_chart:
        log(f"Error: No chart matched the title '{chart_title}' in sheet '{sheet_name}'")
        return None

    chart = matched_chart

    if isinstance(chart, openpyxl.chart.pie_chart.PieChart):
        chart_type = "pie"
    elif isinstance(chart, openpyxl.chart.bar_chart.BarChart):
        chart_type = "bar"
    elif isinstance(chart, openpyxl.chart.line_chart.LineChart):
        chart_type = "line"
    else:
        chart_type = "unknown"

    category_axis_title, value_axis_title = extract_axis_titles(sheet, chart)

    # Determine barmode and orientation
    barmode = 'group'
    orientation = 'v'
    if chart_type == "bar" and isinstance(chart, openpyxl.chart.bar_chart.BarChart):
        if getattr(chart, "barDir", None) == "bar":
            orientation = 'h'
        elif getattr(chart, "barDir", None) == "col":
            orientation = 'v'
        grouping = getattr(chart, "grouping", None)
        if grouping == "stacked":
            barmode = "stack"
        elif grouping == "percentStacked":
            barmode = "relative"
        log(f"Detected barDir: {chart.barDir}, grouping: {grouping}, orientation: {orientation}, barmode: {barmode}")

    extracted_series = []
    chart_global_categories = []

    if hasattr(chart, 'x_axis') and chart.x_axis and \
       hasattr(chart.x_axis, 'categories') and chart.x_axis.categories and \
       hasattr(chart.x_axis.categories, 'strRef') and chart.x_axis.categories.strRef:
        cat_ref = chart.x_axis.categories.strRef.f
        chart_global_categories = parse_range(sheet, cat_ref)

    if not chart_global_categories and chart.series:
        first_series = chart.series[0]
        if hasattr(first_series, 'cat') and first_series.cat and \
           hasattr(first_series.cat, 'numRef') and first_series.cat.numRef:
            cat_ref = first_series.cat.numRef.f
            chart_global_categories = parse_range(sheet, cat_ref)

    if not chart_global_categories and chart.series:
        first_series = chart.series[0]
        if first_series.val and first_series.val.numRef:
            val_ref = first_series.val.numRef.f.replace('$', '').split('!')[-1]
            min_col, min_row, max_col, max_row = range_boundaries(val_ref)
            if min_col > 1:
                chart_global_categories = [
                    sheet.cell(row=r, column=min_col - 1).value
                    for r in range(min_row, max_row + 1)
                ]

    for i, series in enumerate(chart.series, start=1):
        try:
            if series.val is None or series.val.numRef is None:
                continue
            value_ref = series.val.numRef.f
            values = parse_range(sheet, value_ref)
            if not values:
                continue

            categories = chart_global_categories
            if not categories and hasattr(series, 'cat') and series.cat and hasattr(series.cat, 'numRef'):
                categories = parse_range(sheet, series.cat.numRef.f)

            if not categories:
                continue

            title = f"Series {i}"
            try:
                if series.title and series.title.strRef:
                    ref_only = series.title.strRef.f.split('!')[-1].replace('$', '')
                    title = sheet[ref_only].value or title
                elif series.tx and series.tx.strRef:
                    ref_only = series.tx.strRef.f.split('!')[-1].replace('$', '')
                    title = sheet[ref_only].value or title
            except Exception:
                pass

            extracted_series.append({
                "title": title,
                "categories": categories,
                "values": values
            })
        except Exception as e:
            log(f"  Warning: Failed to extract series {i}: {e}")
            continue

    if not extracted_series:
        return None

    return {
        "chart": chart_title,
        "category_axis_title": category_axis_title,
        "value_axis_title": value_axis_title,
        "series": extracted_series,
        "barmode": barmode,
        "orientation": orientation,
        "chart_type": chart_type,
        "global_categories": chart_global_categories
    }

def normalize_category(cat):
    if isinstance(cat, str):
        return cat.strip()
    return str(cat) if cat is not None else None

def create_plotly_chart(chart_data):
    fig = go.Figure()
    chart_type = chart_data.get("chart_type", "bar")
    orientation = chart_data.get("orientation", "v")
    all_categories = [normalize_category(c) for c in chart_data.get("global_categories", [])]

    if chart_type == "pie":
        if chart_data['series']:
            series = chart_data['series'][0]
            labels = [normalize_category(c) for c in series['categories']]
            fig.add_trace(go.Pie(labels=labels, values=series['values'], name=series['title']))
    else:
        for series in chart_data['series']:
            cat_to_val = {
                normalize_category(cat): val
                for cat, val in zip(series['categories'], series['values'])
            }
            aligned_y = [cat_to_val.get(cat, None) for cat in all_categories]

            if chart_type == "bar":
                trace_args = {
                    "name": series['title'],
                    "orientation": orientation
                }
                if orientation == 'h':
                    trace_args.update(x=aligned_y, y=all_categories)
                else:
                    trace_args.update(x=all_categories, y=aligned_y)
                fig.add_trace(go.Bar(**trace_args))
            elif chart_type == "line":
                fig.add_trace(go.Scatter(x=all_categories, y=aligned_y, mode="lines+markers", name=series['title']))

        if chart_type == "bar":
            fig.update_layout(barmode=chart_data.get("barmode", "group"))
            if orientation == 'v':
                fig.update_xaxes(categoryorder='array', categoryarray=all_categories)
            else:
                fig.update_yaxes(categoryorder='array', categoryarray=all_categories)

    fig.update_layout(
        title=chart_data['chart'],
        xaxis_title=chart_data.get('category_axis_title'),
        yaxis_title=chart_data.get('value_axis_title'),
        hovermode="x unified",
        legend=dict(orientation="h", yanchor="top", y=-0.2, xanchor="center", x=0.5)
    )
    return fig.to_html(full_html=False, config={'responsive': True, 'displaylogo': False})

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python extract_chart_data.py <workbook.xlsx> <sheet name> <chart title>", file=sys.stderr)
        sys.exit(1)

    filename = sys.argv[1]
    sheet_name = sys.argv[2]
    chart_title = sys.argv[3]

    chart_data = extract_chart_data(filename, sheet_name, chart_title)
    if chart_data is None:
        sys.exit(1)

    html = create_plotly_chart(chart_data)
    print(html)

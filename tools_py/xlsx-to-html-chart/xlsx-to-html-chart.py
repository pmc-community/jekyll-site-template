#!/usr/bin/env python3

import sys
import os
from openpyxl import load_workbook
from openpyxl.utils import range_boundaries
import plotly.graph_objects as go
import openpyxl.chart.bar_chart
import openpyxl.chart.pie_chart
import openpyxl.chart.line_chart

logShow = False # Set to False to disable logging output

def log(*args, **kwargs):
    global logShow # Declare logShow as global to access it
    if logShow: # Only print if logShow is True
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
            return None # This is a cell reference, needs to be resolved by sheet if needed, or default None
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
    # Determine if it's a row or column range predominantly
    if (max_row - min_row + 1) >= (max_col - min_col + 1): # Vertical range or single cell
        for row_idx in range(min_row, max_row + 1):
            cell = sheet.cell(row=row_idx, column=min_col) # Always take from the first column of the range
            values.append(cell.value)
    else: # Horizontal range
        for col_idx in range(min_col, max_col + 1):
            cell = sheet.cell(row=min_row, column=col_idx) # Always take from the first row of the range
            values.append(cell.value)
    return values


def extract_axis_titles(sheet, chart):
    category_axis_title = None
    value_axis_title = None

    try:
        if hasattr(chart, 'x_axis') and chart.x_axis and chart.x_axis.title:
            if isinstance(chart.x_axis.title, str):
                category_axis_title = chart.x_axis.title
            elif hasattr(chart.x_axis.title, 'tx') and hasattr(chart.x_axis.title.tx, 'rich') and hasattr(chart.x_axis.title.tx.rich, 'p'):
                if chart.x_axis.title.tx.rich.p and len(chart.x_axis.title.tx.rich.p) > 0 and hasattr(chart.x_axis.title.tx.rich.p[0], 'r'):
                    if chart.x_axis.title.tx.rich.p[0].r and len(chart.x_axis.title.tx.rich.p[0].r) > 0 and hasattr(chart.x_axis.title.tx.rich.p[0].r[0], 't'):
                        category_axis_title = chart.x_axis.title.tx.rich.p[0].r[0].t

        if hasattr(chart, 'y_axis') and chart.y_axis and chart.y_axis.title:
            if isinstance(chart.y_axis.title, str):
                value_axis_title = chart.y_axis.title
            elif hasattr(chart.y_axis.title, 'tx') and hasattr(chart.y_axis.title.tx, 'rich') and hasattr(chart.y_axis.title.tx.rich, 'p'):
                if chart.y_axis.title.tx.rich.p and len(chart.y_axis.title.tx.rich.p) > 0 and hasattr(chart.y_axis.title.tx.rich.p[0], 'r'):
                    if chart.y_axis.title.tx.rich.p[0].r and len(chart.y_axis.title.tx.rich.p[0].r) > 0 and hasattr(chart.y_axis.title.tx.rich.p[0].r[0], 't'):
                        value_axis_title = chart.y_axis.title.tx.rich.p[0].r[0].t
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
    log(f"Axis Titles: Category='{category_axis_title}', Value='{value_axis_title}'")

    extracted_series = []
    chart_global_categories = []

    # Attempt to find common categories from the chart's x_axis first
    if hasattr(chart, 'x_axis') and chart.x_axis and \
       hasattr(chart.x_axis, 'categories') and chart.x_axis.categories and \
       hasattr(chart.x_axis.categories, 'strRef') and chart.x_axis.categories.strRef:
        cat_ref = chart.x_axis.categories.strRef.f
        chart_global_categories = parse_range(sheet, cat_ref)
        if chart_global_categories:
            log(f"Found global categories from chart.x_axis.categories: {chart_global_categories}")

    # Fallback: If global categories not found, try the first series' explicit category ref
    if not chart_global_categories and chart.series:
        first_series = chart.series[0]
        if hasattr(first_series, 'cat') and first_series.cat and \
           hasattr(first_series.cat, 'numRef') and first_series.cat.numRef:
            cat_ref = first_series.cat.numRef.f
            chart_global_categories = parse_range(sheet, cat_ref)
            if chart_global_categories:
                log(f"Found global categories from first series.cat.numRef: {chart_global_categories}")

    # Final fallback: If no explicit category reference, infer from the column to the left of the *first* series' values
    if not chart_global_categories and chart.series:
        first_series = chart.series[0]
        if first_series.val and first_series.val.numRef:
            val_ref = first_series.val.numRef.f
            if '!' in val_ref:
                val_ref = val_ref.split('!')[1]
            val_ref = val_ref.replace('$', '')
            min_col, min_row, max_col, max_row = range_boundaries(val_ref)

            if min_col > 1: # Check if there's a column to the left
                inferred_categories = []
                for row_idx in range(min_row, max_row + 1):
                    cell_val = sheet.cell(row=row_idx, column=min_col - 1).value
                    inferred_categories.append(cell_val)
                if inferred_categories:
                    chart_global_categories = inferred_categories
                    log(f"Inferred global categories from column to left of first series: {chart_global_categories}")
            elif min_row > 1: # Check if there's a row above (for horizontal categories)
                inferred_categories = []
                for col_idx in range(min_col, max_col + 1):
                    cell_val = sheet.cell(row=min_row - 1, column=col_idx).value
                    inferred_categories.append(cell_val)
                if inferred_categories:
                    chart_global_categories = inferred_categories
                    log(f"Inferred global categories from row above first series: {chart_global_categories}")


    for i, series in enumerate(chart.series, start=1):
        try:
            if series.val is None or series.val.numRef is None:
                log(f"  Warning: Series {i} has no value reference.")
                continue
            value_ref = series.val.numRef.f
            values = parse_range(sheet, value_ref)
            if not values:
                log(f"  Warning: Series {i} values empty.")
                continue

            # Use the global categories found earlier
            categories = chart_global_categories
            if not categories:
                log(f"  Warning: No global categories found for chart. Attempting to use series-specific category if available for Series {i}.")
                # If no global categories, fall back to series' own category ref if it exists
                if hasattr(series, 'cat') and series.cat and hasattr(series.cat, 'numRef') and series.cat.numRef:
                    categories = parse_range(sheet, series.cat.numRef.f)
                if not categories:
                    log(f"  Error: Cannot determine categories for Series {i} from any source. Skipping.")
                    continue


            title = None
            if series.title and series.title.strRef:
                title_cell_ref = series.title.strRef.f
                ref_only = title_cell_ref.split('!')[-1].replace('$', '')
                try:
                    title = sheet[ref_only].value
                except Exception as e:
                    log(f"  Warning: Could not resolve series title cell reference '{title_cell_ref}': {e}")
                    title = f"Series {i}"
            elif series.tx and series.tx.strRef:
                title_cell_ref = series.tx.strRef.f
                ref_only = title_cell_ref.split('!')[-1].replace('$', '')
                try:
                    title = sheet[ref_only].value
                except Exception as e:
                    log(f"  Warning: Could not resolve series title cell reference '{title_cell_ref}': {e}")
                    title = f"Series {i}"
            if not title:
                title = f"Series {i}"

            extracted_series.append({
                "title": title,
                "categories": categories, # All series will now use the same categories
                "values": values
            })
        except Exception as e:
            log(f"  Warning: Failed to extract series {i}: {e}")
            continue

    if not extracted_series:
        log(f"Skipping chart '{chart_title}' — no valid series extracted.")
        return None

    barmode = 'group'
    if chart_type == "bar" and hasattr(chart, 'grouping'):
        grouping_value = chart.grouping
        log(f"Detected chart grouping: {grouping_value}")
        if grouping_value in ('stacked', 'percentStacked'):
            barmode = 'stack'

    return {
        "chart": chart_title,
        "category_axis_title": category_axis_title,
        "value_axis_title": value_axis_title,
        "series": extracted_series,
        "barmode": barmode,
        "chart_type": chart_type,
        "global_categories": chart_global_categories # Pass global categories for consistent plotting
    }


def normalize_category(cat):
    if isinstance(cat, str):
        return cat.strip()
    return str(cat) if cat is not None else None


def create_plotly_chart(chart_data):
    fig = go.Figure()
    chart_type = chart_data.get("chart_type", "bar")
    # Use the globally determined categories from chart_data
    all_categories_sorted = [normalize_category(c) for c in chart_data.get("global_categories", [])]

    if chart_type == "pie":
        if chart_data['series']:
            series = chart_data['series'][0]
            labels = [normalize_category(c) for c in series['categories']]
            fig.add_trace(go.Pie(
                labels=labels,
                values=series['values'],
                name=series['title']
            ))
        else:
            log("Warning: No series found for pie chart.")
    else: # bar or line
        for series in chart_data['series']:
            cat_to_val = {
                normalize_category(cat): val
                for cat, val in zip(series['categories'], series['values'])
            }

            # Crucially, align y-values with the GLOBAL sorted categories.
            # If a category doesn't exist for this specific series, its value will be None.
            aligned_y_values = [cat_to_val.get(cat, None) for cat in all_categories_sorted]

            if chart_type == "bar":
                fig.add_trace(go.Bar(
                    x=all_categories_sorted, # All traces share the same x-axis categories
                    y=aligned_y_values,
                    name=series['title']
                ))
            elif chart_type == "line":
                fig.add_trace(go.Scatter(
                    x=all_categories_sorted, # All traces share the same x-axis categories
                    y=aligned_y_values,
                    mode='lines+markers',
                    name=series['title']
                ))

        if chart_type == "bar":
            fig.update_layout(barmode=chart_data.get('barmode', 'group'))
            # Explicitly set category order to ensure 'A', 'B', 'C', 'D' etc.
            fig.update_xaxes(categoryorder='array', categoryarray=all_categories_sorted)

    fig.update_layout(
        title=chart_data['chart'],
        xaxis_title=chart_data.get('category_axis_title'),
        yaxis_title=chart_data.get('value_axis_title'),
        hovermode="x unified"
    )

    return fig.to_html(full_html=True)


if __name__ == "__main__":
    if len(sys.argv) != 4:
        log("Usage: python extract_chart_data.py <workbook.xlsx> <sheet name> <chart title>")
        sys.exit(1)

    filename = sys.argv[1]
    sheet_name = sys.argv[2]
    chart_title = sys.argv[3]

    chart_data = extract_chart_data(filename, sheet_name, chart_title)
    if chart_data is None:
        sys.exit(1)

    html = create_plotly_chart(chart_data)
    print(html)
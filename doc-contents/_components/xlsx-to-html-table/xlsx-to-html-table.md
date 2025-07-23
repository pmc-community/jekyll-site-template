---
layout: page
title: XLSX Tables
permalink: /components/xlsx-tables/
categories: [Components]
tags: [table, xls]
---

# Summary
We know that, for many users, creating a table in markdown can be quite a challenge. When it comes to merged cells, things may go crazy very quick. Also, maintaining a table in markdown will become, sooner or later, a vrey frustrating activity, even for advanced users with good markdown knowledge. So ... why not give the tables experts what is rightfully theirs? Why not creating tables in Excel and loading them in our docs? This component does this ... now, tables direct in markdown is just a memory!

# Features
For most of the cases, this component provides columns selection and sorting, pagination and table search.

# Limitations
It is always assumed that the first row is the table header. Columns selection and sorting, pagination and table search are not available for table containing merged cells (rowspan and/or colspan). It is also always assumed that the excel file(s) containing your tables are located in the same folder as the parent document which must render the tables, or in a sub-folder of the parent document as will be shown.

# Examples
Considering the following folder structure:

{% DirStructure doc-contents/_components/xlsx-to-html-table %}

See how tables from Excel can be imported in your docs.

## From same folder

{% raw %}
```javascript
{% include elements/xlsx-to-html-table.html 
    file="test-file.xlsx" 
    range="B3:E13" 
    sheet="Test Sheet"
    source=page.path
    simple="false"
%}
```
{% endraw %}

{% include elements/xlsx-to-html-table.html 
    file="test-file.xlsx" 
    range="B3:E13" 
    sheet="Test Sheet"
    source=page.path
    simple="false"
%}

{% include elements/alert.html class="primary" 
    content="Note that table above contains merged cells, thus some features are not available. `simple` parameter can be ignored here but is intentionally provided to show that, even if passed as `false`, the table will stay simple, without some features" 
%}

## From a sub-folder

{% raw %}
```javascript
{% include elements/xlsx-to-html-table.html 
    file="tables/test-file.xlsx" 
    range="B3:E9" 
    sheet="Test Sheet"
    source=page.path
    simple="false"
%}
```
{% endraw %}

{% include elements/xlsx-to-html-table.html 
    file="tables/test-file.xlsx" 
    range="B3:E9" 
    sheet="Test Sheet"
    source=page.path
    simple="false"
%}

{% include elements/alert.html class="primary" 
    content="Note that the table above doesn't contains merged cells, thus can be fully featured, depending on `simple` parameter." 
%}

# Parameters
- `file`: the XLSX file. Other Excel formats (older) are not accepted. Note that when provided as simple file name, the component search for it in the same folder where the its parent document is located. Otherwise it should be provided as relative path from the folder where the its parent document is located.
- `range`: the portion of the table which is imported. Remember that the first row is always assumed as the table header.
- `sheet`: the sheet where the table is located inside the workbook
- `source`: the parent document, including its relative path to the root of the site directory. `DO NOT CHANGE THIS PARAMETER !!!`
- `simple`: specify if the table is rendered as simple table, without features like `rows per page`, `search`, `pagination` or `columns selector`. If the table contains merged cells, this parameter will not have any influence. Its default value is `true`, but is ignored in the case of detecting merged cells.
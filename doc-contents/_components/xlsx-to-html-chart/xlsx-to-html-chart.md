---
layout: page
title: XLSX Charts
permalink: /components/xlsx-charts/
categories: [Components]
tags: [table, xls, chart]
---

# Summary
This component allows importing Excel charts into your documents. In simple words, create your charts in Excel because Excel is built for this (among others) and use this component to get it into your documents as it will be shown below. Combined with [`Tables`](/components/xlsx-tables/){: target="_blank"} component, this one provides the full support to share structured data in a professional way, including some extent of interactivity.

# Limitations
Currently we support only:
- Line charts
- Column and Bar charts
- Pie and doughnut charts

We do not support importing the colors you assign to the series in the Excel chart. The colors that will be used are randomly selected in order to provide the best user experience possible.

# Examples
The next examples are baset on the files located as shown below:

{% DirStructure doc-contents/_components/xlsx-to-html-chart %}

Observe that the excel files are located in the same folder as the parent document. These files can be also located in a sub-folder of the parent document folder, but not outside the parent document folder.

## Bar chart (horizontal)

{% raw %}
```javascript
{% include elements/xlsx-to-html-chart.html 
    file="corrected-example.xlsx" 
    sheet="Corrected Sheet"
    chart="Chart 1"
    source=page.path
    border="true"
%}
```
{% endraw %}

{% include elements/xlsx-to-html-chart.html 
    file="corrected-example.xlsx" 
    sheet="Corrected Sheet"
    chart="Chart 1"
    source=page.path
    border="true"
%}

## Pie chart

{% raw %}
```javascript
{% include elements/xlsx-to-html-chart.html 
    file="corrected-example.xlsx" 
    sheet="Corrected Sheet"
    chart="Chart 2"
    source=page.path
    border="true"
%}
```
{% endraw %}

{% include elements/xlsx-to-html-chart.html 
    file="corrected-example.xlsx" 
    sheet="Corrected Sheet"
    chart="Chart 2"
    source=page.path
    border="true"
%}

## Line chart

{% raw %}
```javascript
{% include elements/xlsx-to-html-chart.html 
    file="test-file.xlsx" 
    sheet="Test Sheet"
    chart="Test Chart 1"
    source=page.path
    border="true"
%}
```
{% endraw %}

{% include elements/xlsx-to-html-chart.html 
    file="test-file.xlsx" 
    sheet="Test Sheet"
    chart="Test Chart 1"
    source=page.path
    border="true"
%}

## Doughnut chart

{% raw %}
```javascript
{% include elements/xlsx-to-html-chart.html 
    file="test-file.xlsx" 
    sheet="Test Sheet"
    chart="Test Chart 2"
    source=page.path
    border="true"
%}
```
{% endraw %}
 
{% include elements/xlsx-to-html-chart.html 
    file="test-file.xlsx" 
    sheet="Test Sheet"
    chart="Test Chart 2"
    source=page.path
    border="true"
%}

# Parameters
- `file`: the XLSX file. Other Excel formats (older) are not accepted. Note that when provided as simple file name, the component search for it in the same folder where the its parent document is located. Otherwise it should be provided as relative path from the folder where the its parent document is located.
- `sheet`: the sheet where the chart is located inside the workbook
- `chart`: the chart title
- `source`: the parent document, including its relative path to the root of the site directory. `DO NOT CHANGE THIS PARAMETER !!!`
- `border`: specify if the chart will be wrapped into a container having a thin border. The default value is `false` so, if you don't want a border, you can pass this parameter with `false` value or to ignore it and do not pass anything
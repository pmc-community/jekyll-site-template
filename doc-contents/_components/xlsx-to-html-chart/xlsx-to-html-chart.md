---
layout: page
title: XLSX Charts
permalink: /components/xlsx-charts/
categories: [Components]
tags: [table, xls, chart]
---

{% include elements/xlsx-to-html-chart.html 
    file="corrected-example.xlsx" 
    sheet="Corrected Sheet"
    chart="Chart 1"
    source=page.path
    border="true"
%}

and a new one ... 

{% include elements/xlsx-to-html-chart.html 
    file="corrected-example.xlsx" 
    sheet="Corrected Sheet"
    chart="Chart 2"
    source=page.path
    border="true"
%}

and one more ... 

{% include elements/xlsx-to-html-chart.html 
    file="test-file.xlsx" 
    sheet="Test Sheet"
    chart="Test Chart 1"
    source=page.path
    border="true"
%}

finally ... 
 
{% include elements/xlsx-to-html-chart.html 
    file="test-file.xlsx" 
    sheet="Test Sheet"
    chart="Test Chart 2"
    source=page.path
    border="true"
%}
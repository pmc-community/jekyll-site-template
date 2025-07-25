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
    chart="Corrected Chart"
    source=page.path
%}

and a new one ... 

{% include elements/xlsx-to-html-chart.html 
    file="corrected-example.xlsx" 
    sheet="Corrected Sheet"
    chart="Chart 2"
    source=page.path
%}

and one more ... 

{% include elements/xlsx-to-html-chart.html 
    file="test-file.xlsx" 
    sheet="Test Sheet"
    chart="c1"
    source=page.path
%}

finally ... 
 
{% include elements/xlsx-to-html-chart.html 
    file="test-file.xlsx" 
    sheet="Test Sheet"
    chart="c2"
    source=page.path
%}
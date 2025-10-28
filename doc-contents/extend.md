---
layout: page
title: Extend
permalink: /extend/
categories: [General]
tags: [extend, hooks, low-code, code]
has_children: false
nav_order: 4
---

# Summary
We offer out-of-the-box the possibility to extend the functionality of the site by hooking on the execution of the functions on browser side. Although this feature was initially designed to allow different integrations (such as GA/GTM or New Relic), it is perfectly adapted to extend the functionality of the site as it may be needed. Be aware that using extensions requires development skills (mostly on Javascript). The level of the required skills depends on the complexity of the extension. 

The basic principle of hooks is that are executed immediately after the execution of the target function (which has to be known in the global scope), it is aware of the result of the execution of the target function, it is aware of the arguments used to execute the target function and it can take additional parameters to further extend the functionality.

# Usage
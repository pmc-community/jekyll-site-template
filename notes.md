# Liquid in js/scss

1. create file test.js.liquid (or similar with scss)
2. add in _config.yml
include:
  - assets/js/test.js.liquid
3. test.js.liquid must be like

---
layout: null
permalink: /assets/js/test.js
---
console.log('123');

4. add <script src="{{ '/assets/js/test.js' | relative_url }}"></script> to head_custom.html

5. 1,2,3 will create test.js in _site/assets/js/
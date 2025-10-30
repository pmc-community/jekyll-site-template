---
name: ⚒️ Target function
---

👀 Locate and bring the target function to global scope
{: .text-primary}

- Go to `assets\js\savedItems.js` 
- find `addNote = (note, pageInfo) => {....}`
- make sure that is defined like `window.addNote = (note, pageInfo) => {}` and not like `const addNote = (note, pageInfo) => {}`

This will bring it into global scope and make it hookable.
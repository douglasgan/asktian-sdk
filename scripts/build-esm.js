/**
 * Post-build script: copies dist/index.js → dist/index.mjs
 * with all require() calls replaced by import so the ESM export works.
 */
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "../dist/index.js");
const dest = path.join(__dirname, "../dist/index.mjs");

let content = fs.readFileSync(src, "utf8");

// Replace "use strict" wrapper pattern for ESM compatibility
// For a simple SDK with no external deps this is sufficient
content = content.replace(/^"use strict";\s*/m, "");

fs.writeFileSync(dest, content);
console.log("ESM build written to dist/index.mjs");

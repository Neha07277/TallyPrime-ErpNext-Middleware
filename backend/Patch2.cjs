const fs = require("fs");
const filePath = process.argv[2];
if (!filePath) { console.error("Usage: node patch2.cjs <path>"); process.exit(1); }

let content = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");

// Check what the current godown mapper looks like
const idx = content.indexOf("syncGodownsToErpNext");
const block = content.slice(idx, idx + 800);
console.log("Current block:\n", block);

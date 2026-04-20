const fs = require("fs");
const filePath = process.argv[2];
let content = fs.readFileSync(filePath, "utf8");

// Count occurrences
const matches = [...content.matchAll(/syncGodownsToErpNext/g)];
console.log("Total occurrences of syncGodownsToErpNext:", matches.length);
matches.forEach((m, i) => {
  console.log(`\n--- Occurrence ${i+1} at index ${m.index} ---`);
  console.log(content.slice(m.index, m.index + 200));
});

// Count parent_warehouse assignments
const pw = [...content.matchAll(/parent_warehouse/g)];
console.log("\nTotal parent_warehouse occurrences:", pw.length);
pw.forEach((m, i) => {
  console.log(`\n--- pw ${i+1} at index ${m.index} ---`);
  console.log(content.slice(m.index, m.index + 100));
});

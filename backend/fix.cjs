const fs = require("fs");
const filePath = process.argv[2];
let content = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");

const OLD = `    const rawParent = (g.parent || "").trim();
    const parentWarehouse = (rawParent && rawParent.toLowerCase() !== "primary")
      ? rawParent + " - " + companyAbbr
      : rootWarehouse;`;

const NEW = `    const rawParent = (g.parent || "").replace(/[\\s\\u00A0\\u200B]+/g, " ").trim();
    const parentWarehouse = (rawParent && rawParent.toLowerCase() !== "primary")
      ? rawParent + " - " + companyAbbr
      : rootWarehouse;`;

if (!content.includes(OLD)) {
  console.error("Could not find target. Current rawParent line:");
  const idx = content.indexOf("rawParent");
  console.log(content.slice(idx, idx + 200));
  process.exit(1);
}

content = content.replace(OLD, NEW);
fs.writeFileSync(filePath, content, "utf8");
console.log("SUCCESS - restart server now.");

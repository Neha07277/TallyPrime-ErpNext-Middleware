const fs = require("fs");
const filePath = process.argv[2];
let content = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");

// Replace the entire mapper logic with a bulletproof version
const OLD = `    const rawParent = (g.parent || "").replace(/[\\s\\u00A0\\u200B]+/g, " ").trim();
    const parentWarehouse = (rawParent && rawParent.toLowerCase() !== "primary")
      ? rawParent + " - " + companyAbbr
      : rootWarehouse;
    const doc = {
      warehouse_name:   g.name,
      company:          companyName,
      is_group:         0,
      parent_warehouse: parentWarehouse,
    };
    logger.info("[Warehouse] Sending doc: name=" + g.name + ", parent_warehouse=" + parentWarehouse);
    return { filters: { warehouse_name: g.name }, doc };`;

const NEW = `    // Strip ALL whitespace variants (regular, non-breaking, zero-width) from Tally parent name
    const rawParent = Array.from(g.parent || "")
      .filter(ch => ch.charCodeAt(0) > 32 && ch.charCodeAt(0) !== 160 && ch.charCodeAt(0) !== 8203)
      .join("").toLowerCase();
    const parentWarehouse = (rawParent && rawParent !== "primary")
      ? (g.parent || "").trim() + " - " + companyAbbr
      : rootWarehouse;
    logger.info("[Warehouse] rawParent='" + rawParent + "' parentWarehouse='" + parentWarehouse + "'");
    const doc = {
      warehouse_name:   g.name,
      company:          companyName,
      is_group:         0,
      parent_warehouse: parentWarehouse,
    };
    return { filters: { warehouse_name: g.name }, doc };`;

if (!content.includes(OLD)) {
  // Try finding rawParent block regardless
  const idx = content.indexOf("rawParent");
  if (idx === -1) { console.error("rawParent not found at all!"); process.exit(1); }
  console.error("OLD block not matched exactly. Current content around rawParent:");
  console.log(JSON.stringify(content.slice(idx - 10, idx + 400)));
  process.exit(1);
}

content = content.replace(OLD, NEW);
fs.writeFileSync(filePath, content, "utf8");
console.log("SUCCESS");

const fs = require("fs");

const filePath = process.argv[2];
if (!filePath) { console.error("Usage: node patch.cjs <path>"); process.exit(1); }

let content = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");

// Find the function and replace it entirely using regex
const regex = /(\/\/ -- Godowns -> Warehouses -+\n)export async function syncGodownsToErpNext[\s\S]*?\n\}\n/;

if (!regex.test(content)) {
  console.error("Could not find syncGodownsToErpNext block. Dumping surrounding context:");
  const idx = content.indexOf("syncGodownsToErpNext");
  console.log(content.slice(Math.max(0, idx - 50), idx + 500));
  process.exit(1);
}

const NEW = `// -- Godowns -> Warehouses ----------------------------------------------------
async function resolveRootWarehouse(client, companyName, companyAbbr) {
  try {
    const res = await client.get("/api/resource/Warehouse", {
      params: {
        filters: JSON.stringify([["Warehouse","company","=",companyName],["Warehouse","is_group","=",1],["Warehouse","parent_warehouse","=",""]]),
        fields:  '["name"]',
        limit:   1,
      },
    });
    const name = res.data && res.data.data && res.data.data[0] && res.data.data[0].name;
    if (name) { logger.info("Root warehouse resolved: " + name); return name; }
  } catch (e) {
    logger.warn("Could not resolve root warehouse: " + e.message);
  }
  return "All Warehouses - " + companyAbbr;
}

export async function syncGodownsToErpNext(godowns, companyName, creds = {}) {
  const client = createErpClient(creds);
  companyName = await resolveErpNextCompany(client, companyName, creds);
  const companyAbbr = await getCompanyAbbr(client, companyName);
  logger.info("Syncing " + godowns.length + " godowns to ERPNext for " + companyName + " (abbr: " + companyAbbr + ")");

  const rootWarehouse = await resolveRootWarehouse(client, companyName, companyAbbr);

  const results = await batchSync(client, "Warehouse", godowns, (g) => {
    const rawParent = (g.parent || "").trim();
    const parentWarehouse = (rawParent && rawParent.toLowerCase() !== "primary")
      ? rawParent + " - " + companyAbbr
      : rootWarehouse;
    const doc = {
      warehouse_name:   g.name,
      company:          companyName,
      is_group:         0,
      parent_warehouse: parentWarehouse,
    };
    return { filters: { warehouse_name: g.name }, doc };
  });

  logger.success("Godown sync done - created: " + results.created + ", updated: " + results.updated + ", failed: " + results.failed);
  return results;
}
`;

content = content.replace(regex, NEW);
fs.writeFileSync(filePath, content, "utf8");
console.log("SUCCESS - file patched. Restart your server now.");

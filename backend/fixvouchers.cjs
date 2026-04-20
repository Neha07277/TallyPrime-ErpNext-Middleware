const fs = require("fs");
const filePath = process.argv[2];
if (!filePath) { console.error("Usage: node fixvouchers.cjs <path>"); process.exit(1); }

let content = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");

const OLD = `  const dateFilter =
    fromDate && toDate
      ? \`<SVFROMDATE>\${fromDate.replace(/-/g, "")}</SVFROMDATE>
         <SVTODATE>\${toDate.replace(/-/g, "")}</SVTODATE>\`
      : "";

  const xml = \`
<ENVELOPE>
 <HEADER>
  <VERSION>1</VERSION>
  <TALLYREQUEST>Export Data</TALLYREQUEST>
  <TYPE>Collection</TYPE>
  <ID>VoucherCollection</ID>
 </HEADER>
 <BODY>
  <DESC>
   <STATICVARIABLES>
    <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
    <SVCURRENTCOMPANY>\${escapeXml(companyName)}</SVCURRENTCOMPANY>
    \${dateFilter}
   </STATICVARIABLES>
   <TDL>
    <TDLMESSAGE>
     <COLLECTION NAME="VoucherCollection">
      <TYPE>Voucher</TYPE>
      <FETCH>GUID,DATE,VOUCHERTYPENAME,VOUCHERNUMBER,REFERENCE,PARTYLEDGERNAME,NARRATION,ALLLEDGERENTRIES.LIST,ISINVOICE,ISOPTIONAL,ISPOSTDATED</FETCH>
     </COLLECTION>
    </TDLMESSAGE>
   </TDL>
  </DESC>
 </BODY>
</ENVELOPE>\`;`;

const NEW = `  // Convert YYYY-MM-DD to YYYYMMDD for Tally date filter
  const tallyFrom = fromDate ? fromDate.replace(/-/g, "") : null;
  const tallyTo   = toDate   ? toDate.replace(/-/g, "")   : null;

  // Use FILTERS with $$InRange for reliable date filtering in Tally collections
  const dateFilterBlock = tallyFrom && tallyTo
    ? \`<FILTERS>IsInDateRange</FILTERS>
     <COMPUTEDFIELDS>
      <FIELD>
       <NAME>IsInDateRange</NAME>
       <EXPR>$$InRange:\${tallyFrom}:\${tallyTo}:$DATE</EXPR>
      </FIELD>
     </COMPUTEDFIELDS>\`
    : "";

  const xml = \`
<ENVELOPE>
 <HEADER>
  <VERSION>1</VERSION>
  <TALLYREQUEST>Export Data</TALLYREQUEST>
  <TYPE>Collection</TYPE>
  <ID>VoucherCollection</ID>
 </HEADER>
 <BODY>
  <DESC>
   <STATICVARIABLES>
    <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
    <SVCURRENTCOMPANY>\${escapeXml(companyName)}</SVCURRENTCOMPANY>
   </STATICVARIABLES>
   <TDL>
    <TDLMESSAGE>
     <COLLECTION NAME="VoucherCollection">
      <TYPE>Voucher</TYPE>
      <FETCH>GUID,DATE,VOUCHERTYPENAME,VOUCHERNUMBER,REFERENCE,PARTYLEDGERNAME,NARRATION,ALLLEDGERENTRIES.LIST,ISINVOICE,ISOPTIONAL,ISPOSTDATED</FETCH>
      \${dateFilterBlock}
     </COLLECTION>
    </TDLMESSAGE>
   </TDL>
  </DESC>
 </BODY>
</ENVELOPE>\`;`;

if (!content.includes(OLD)) {
  console.error("Could not find target block.");
  const idx = content.indexOf("fetchTallyVouchers");
  console.log(content.slice(idx, idx + 800));
  process.exit(1);
}

content = content.replace(OLD, NEW);
fs.writeFileSync(filePath, content, "utf8");
console.log("SUCCESS - restart server now.");

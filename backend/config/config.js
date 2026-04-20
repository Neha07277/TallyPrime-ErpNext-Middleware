import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT) || 4000,

  tally: {
    url: process.env.TALLY_URL || "http://localhost:9000",
    companyName: process.env.TALLY_COMPANY_NAME || "",
    timeoutMs: 600_000,
  },

  erpnext: {
    url:       process.env.ERPNEXT_URL       || "",   // e.g. https://mysite.frappe.cloud
    apiKey:    process.env.ERPNEXT_API_KEY    || "",   // from ERPNext → Settings → API Access
    apiSecret: process.env.ERPNEXT_API_SECRET || "",
  },
};
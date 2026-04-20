import { useEffect, useState } from "react";
import DashboardWrapper from "./DashboardWrapper";
import { tallyAPI } from "./api/tallyAPI";

function App() {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await tallyAPI.companies();
        console.log("Companies API:", res); // 👈 DEBUG

        // IMPORTANT: depends on your API response
        setCompanies(res?.data || res || []);
      } catch (err) {
        console.error("Failed to load companies", err);
      }
    }

    loadCompanies();
  }, []);

  return <DashboardWrapper companies={companies} />;
}

export default App;
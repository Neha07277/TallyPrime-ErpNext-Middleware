import { useState } from "react";

import { SyncToErpNext } from "./pages/SyncToErpNext";
import { MiddlewareCheck } from "./pages/MiddlewareCheck";
import { QuickFetch } from "./pages/QuickFetch";
import { LiveLogs } from "./pages/LiveLogs";

export default function DashboardWrapper({ companies }) {
  const [activeTab, setActiveTab] = useState("check");

  return (
    <div className="flex h-screen bg-[#f6f8fb]">

      {/* 🔥 SIDEBAR */}
      <div className="w-64 bg-white border-r flex flex-col">

        <div className="h-16 flex items-center px-6 border-b">
          <h1 className="text-base font-semibold text-gray-800">
            Tally → ERPNext
          </h1>
        </div>

        <div className="p-4 space-y-2 text-sm">

          <button
            onClick={() => setActiveTab("check")}
            className={`w-full text-left px-3 py-2 rounded-lg ${
              activeTab === "check"
                ? "bg-blue-50 text-blue-600 font-medium"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Data Check
          </button>

          <button
            onClick={() => setActiveTab("fetch")}
            className={`w-full text-left px-3 py-2 rounded-lg ${
              activeTab === "fetch"
                ? "bg-blue-50 text-blue-600 font-medium"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Quick Fetch
          </button>

          <button
            onClick={() => setActiveTab("sync")}
            className={`w-full text-left px-3 py-2 rounded-lg ${
              activeTab === "sync"
                ? "bg-blue-50 text-blue-600 font-medium"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Sync
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`w-full text-left px-3 py-2 rounded-lg ${
              activeTab === "logs"
                ? "bg-blue-50 text-blue-600 font-medium"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Live Logs
          </button>
        </div>

        <div className="mt-auto p-4 text-xs text-gray-400">
          Middleware v1.0
        </div>
      </div>

      {/* 🔥 MAIN */}
      <div className="flex-1 flex flex-col">

        {/* TOPBAR */}
        <div className="h-16 bg-white border-b flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold text-gray-800">
            Dashboard
          </h2>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Rajlaxmi Solutions Pvt. Ltd.
            </span>

            <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
              R
            </div>
          </div>
        </div>

        {/* 🔥 CONTENT */}
        <div className="flex-1 overflow-y-auto p-6">

          <div className="max-w-[1200px] mx-auto">

            {activeTab === "check" && (
              <MiddlewareCheck companies={companies} />
            )}

            {activeTab === "fetch" && (
              <QuickFetch companies={companies} />
            )}

            {activeTab === "sync" && (
              <SyncToErpNext companies={companies} />
            )}

            {activeTab === "logs" && <LiveLogs />}

          </div>
        </div>
      </div>
    </div>
  );
}
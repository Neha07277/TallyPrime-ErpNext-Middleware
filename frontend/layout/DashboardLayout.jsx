export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <h1 className="text-lg font-bold mb-6">ERP Sync</h1>

        <nav className="space-y-2 text-sm">
          <button className="w-full text-left p-2 rounded-lg hover:bg-gray-100">Dashboard</button>
          <button className="w-full text-left p-2 rounded-lg hover:bg-gray-100">Sync</button>
          <button className="w-full text-left p-2 rounded-lg hover:bg-gray-100">Logs</button>
          <button className="w-full text-left p-2 rounded-lg hover:bg-gray-100">Checks</button>
        </nav>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">

        {/* Topbar */}
        <div className="h-14 bg-white border-b flex items-center px-6 justify-between">
          <h2 className="font-semibold">Dashboard</h2>
          <span className="text-sm text-gray-500">ERPNext Sync System</span>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {children}
        </div>

      </div>
    </div>
  );
}
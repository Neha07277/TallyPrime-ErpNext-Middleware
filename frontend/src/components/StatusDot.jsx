export function StatusDot({ status }) {
  const map = {
    ok:      "bg-green-500",
    warn:    "bg-amber-400",
    fail:    "bg-red-500",
    pending: "bg-gray-300",
    running: "bg-blue-500",
  };
  const ping = status === "running" || status === "ok";
  return (
    <span className="relative inline-flex items-center justify-center w-2 h-2 flex-shrink-0">
      {ping && (
        <span className={`absolute inline-flex w-full h-full rounded-full opacity-50 animate-ping ${map[status]}`} />
      )}
      <span className={`relative inline-flex rounded-full w-2 h-2 ${map[status] || "bg-gray-300"}`} />
    </span>
  );
}
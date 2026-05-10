import { Waypoints } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-3 select-none">
      <img 
        src="/images/ViaGraph_LOGO.png" 
        alt="ViaGraph Logo" 
        className="h-8 w-8 rounded-lg object-cover shadow-md"
      />
      <h1 className="text-xl font-bold tracking-tight">
        <span className="bg-gradient-to-br from-[#5eead4] via-[#2dd4bf] to-[#0d9488] bg-clip-text text-transparent">
          ViaGraph
        </span>
      </h1>
    </div>
  );
}

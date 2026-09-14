import React from "react";
import { useSocket } from "../../context/SocketContext";
import { Wifi, WifiOff } from "lucide-react";

export const ConnectionBanner = () => {
  const { isConnected } = useSocket();

  if (isConnected) {
    return (
      <div className="bg-emerald-600 text-white text-xs font-bold py-1 px-4 flex items-center justify-center gap-1.5 shadow-sm">
        <Wifi className="w-3.5 h-3.5 animate-pulse" />
        <span>LOCAL SERVER CONNECTED (OFFLINE READY)</span>
      </div>
    );
  }

  return (
    <div className="bg-rose-600 text-white text-xs font-bold py-1.5 px-4 flex items-center justify-center gap-2 shadow-sm animate-pulse">
      <WifiOff className="w-4 h-4" />
      <span>CONNECTION LOST • Trying to reconnect to admin server...</span>
    </div>
  );
};

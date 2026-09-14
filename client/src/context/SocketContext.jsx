import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    // Connect to current host
    const socketInstance = io(window.location.origin, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000
    });

    socketInstance.on("connect", () => {
      setIsConnected(true);
      setReconnectAttempts(0);
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    socketInstance.on("reconnect_attempt", (attempt) => {
      setReconnectAttempts(attempt);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, reconnectAttempts }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

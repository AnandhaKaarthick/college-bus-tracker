import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { WS_BASE_URL, API_BASE_URL } from '../config';

const BusContext = createContext();

export function BusProvider({ children }) {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(true);
  const [activeAlertCount, setActiveAlertCount] = useState(2);
  
  const [myBus, setMyBus] = useState({
    bus_id: "1",
    route_id: "1",
    route_name: "Ayapakkam → RIT Express",
    name: "Bus 04",
    occupancy: "low",
    driver_name: "Rajesh Kumar",
    vehicle_number: "TN 09 AB 1234",
    driver_phone: "+919876543210"
  });

  const [myBusETA, setMyBusETA] = useState(8);
  const [nextStop, setNextStop] = useState({ name: "Ayapakkam park" });
  const [activeBusCount, setActiveBusCount] = useState(2);
  const [studentsBoardedCount, setStudentsBoardedCount] = useState(38);

  // Synchronize with verified logged-in user profile
  useEffect(() => {
    if (user && (user.assigned_bus_id || user.assigned_route_id)) {
      setMyBus(prev => ({
        ...prev,
        bus_id: user.assigned_bus_id || prev.bus_id,
        route_id: user.assigned_route_id || prev.route_id,
        route_name: user.assigned_route_name || prev.route_name,
        name: user.assigned_bus_name || prev.name,
        vehicle_number: user.vehicle_number || prev.vehicle_number,
        driver_name: user.role === 'driver' ? user.name : (user.assigned_route_id === '2' ? 'Suresh Raina' : 'Rajesh Kumar')
      }));

      if (user.assigned_stop_name) {
        setNextStop({ name: user.assigned_stop_name });
      }
    }
  }, [user]);

  // Subscribe to live fleet websocket
  useEffect(() => {
    let ws;
    try {
      ws = new WebSocket(`${WS_BASE_URL}/ws/buses`);
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'bus_position') {
            setMyBus(prev => {
              if (String(msg.bus_id) === String(prev.bus_id) || String(msg.route_id) === String(prev.route_id)) {
                return { ...prev, ...msg };
              }
              return prev;
            });
          }
        } catch (e) {
          // ignore parsing error
        }
      };
    } catch (e) {
      console.warn("WebSocket connecting error in BusContext:", e);
    }
    return () => { if (ws) ws.close(); };
  }, []);

  return (
    <BusContext.Provider value={{
      isTracking, setIsTracking,
      activeAlertCount, setActiveAlertCount,
      myBus, setMyBus,
      myBusETA, setMyBusETA,
      nextStop, setNextStop,
      activeBusCount, setActiveBusCount,
      studentsBoardedCount, setStudentsBoardedCount
    }}>
      {children}
    </BusContext.Provider>
  );
}

export function useBusContext() {
  return useContext(BusContext);
}

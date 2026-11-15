import { createContext, useContext, useState } from 'react';

const BusContext = createContext();

export function BusProvider({ children }) {
  const [isTracking, setIsTracking] = useState(true);
  const [activeAlertCount, setActiveAlertCount] = useState(2);
  const [myBus, setMyBus] = useState({
    bus_id: "1",
    route_id: "1",
    route_name: "Ayapakkam → RIT Express",
    name: "Bus 04",
    occupancy: "low",
    driver_name: "Ramesh Kumar",
    vehicle_number: "TN 09 AB 1234",
    driver_phone: "+919876543210"
  });
  const [myBusETA, setMyBusETA] = useState(8);
  const [nextStop, setNextStop] = useState({ name: "Avadi Bus Stand" });
  const [activeBusCount, setActiveBusCount] = useState(12);
  const [studentsBoardedCount, setStudentsBoardedCount] = useState(847);

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

import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import { useTheme } from "../../context/ThemeContext";

// Simple custom marker for the mini-map
const busIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function MiniMapWidget() {
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Placeholder coordinates for the widget
  const defaultCenter = [13.0827, 80.2707]; // Chennai

  return (
    <div 
      className="card p-0 overflow-hidden cursor-pointer flex flex-col"
      onClick={() => navigate("/map")}
    >
      <div className="h-[180px] w-full bg-[var(--bg-tertiary)] relative pointer-events-none">
        <MapContainer 
          center={defaultCenter} 
          zoom={14} 
          zoomControl={false} 
          dragging={false} 
          scrollWheelZoom={false}
          doubleClickZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={defaultCenter} icon={busIcon} />
        </MapContainer>
      </div>
      <div className="px-4 py-3 bg-[var(--bg-secondary)] border-t border-[var(--border)]">
        <p className="text-sm font-medium text-[var(--text-primary)]">📍 Bus 04 is near Central Library</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Tap to open full map &rarr;</p>
      </div>
    </div>
  );
}

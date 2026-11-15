import PageHeader from "../components/PageHeader";
import MapComponent from "../components/MapComponent";

export default function MapPage() {
  return (
    <div className="h-screen flex flex-col">
      <PageHeader title="Campus Map" />
      <div className="flex-1 relative">
        <MapComponent />
      </div>
    </div>
  );
}

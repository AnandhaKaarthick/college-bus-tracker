import os
import sys
import json
import unittest
from fastapi.testclient import TestClient

# Ensure backend directory is in python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app

class TestBackendEndpoints(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_root(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("Welcome", response.json()["message"])

    def test_02_get_routes(self):
        response = self.client.get("/api/routes")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("routes", data)
        self.assertGreater(len(data["routes"]), 0)
        route = data["routes"][0]
        self.assertIn("id", route)
        self.assertIn("stops", route)
        self.assertIn("polyline", route)

    def test_03_get_buses(self):
        response = self.client.get("/api/buses")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("buses", data)
        self.assertGreater(len(data["buses"]), 0)

    def test_04_get_admin_buses(self):
        response = self.client.get("/api/admin/buses")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("buses", data)

    def test_05_update_bus_status(self):
        response = self.client.patch("/api/admin/buses/1/status", json={"status": "delayed"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["new_status"], "delayed")

        # Reset back to on_track
        response = self.client.patch("/api/admin/buses/1/status", json={"status": "on_track"})
        self.assertEqual(response.status_code, 200)

    def test_06_simulate_location(self):
        payload = {
            "bus_id": "1",
            "lat": 13.0827,
            "lng": 80.2707,
            "speed": 25.5
        }
        response = self.client.post("/api/simulate-location", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_07_create_alert(self):
        payload = {
            "type": "breakdown",
            "triggered_by": 1,
            "bus_id": "BUS-1",
            "lat": 13.0827,
            "lng": 80.2707,
            "message": "Engine issue near bus stop"
        }
        response = self.client.post("/api/alerts", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "success")
        self.assertIn("alert_id", response.json())

    def test_08_journey_share(self):
        payload = {
            "student_id": 1,
            "contact_name": "Parent",
            "contact_phone": "+919999999999",
            "bus_id": "1",
            "expires_at": "2026-09-25T22:00:00Z"
        }
        response = self.client.post("/api/journey/share", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertIn("share_id", response.json())
        self.assertIn("share_url", response.json())

    def test_09_escort_request(self):
        payload = {
            "student_id": 1,
            "current_lat": 13.0827,
            "current_lng": 80.2707,
            "destination_stop": "RIT Campus",
            "bus_id": "1"
        }
        response = self.client.post("/api/escort/request", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "assigned")

    def test_10_insights(self):
        res1 = self.client.get("/api/admin/insights/ridership")
        self.assertEqual(res1.status_code, 200)
        self.assertIn("ridership", res1.json())

        res2 = self.client.get("/api/admin/insights/fuel-km")
        self.assertEqual(res2.status_code, 200)
        self.assertIn("fuel_km", res2.json())

    def test_11_history_snapshots(self):
        response = self.client.get("/api/admin/history/snapshots?date=2026-09-25")
        self.assertEqual(response.status_code, 200)
        self.assertIn("snapshots", response.json())

    def test_12_driver_websocket(self):
        with self.client.websocket_connect("/ws/driver/1") as websocket:
            websocket.send_json({
                "type": "location_update",
                "data": {
                    "lat": 13.0850,
                    "lng": 80.2750,
                    "speed": 30.0,
                    "heading": 120.0
                }
            })

if __name__ == "__main__":
    unittest.main()

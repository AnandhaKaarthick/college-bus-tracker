# 🚌 College Bus Tracker Map

A state-of-the-art real-time bus tracking and fleet management system designed for colleges. This platform provides a seamless experience for students to track their commute, drivers to manage their trips, and administrators to optimize fleet performance through advanced analytics.

---

## ✨ Key Features

### 👨‍🎓 Student Experience
- **Real-time Map**: Live tracking of college buses with high-fidelity route visualization.
- **My Profile**: Manage personal details, roll number, and default stops.
- **Bus Attendance**: Check-in and check-out system to help the college track occupancy levels.
- **Smart Notifications**: SMS and Push alerts for delays and ETA warnings.

### 🚛 Driver Portal
- **Shift Management**: Start and end journeys with a single tap.
- **Telemetry Broadcasting**: Real-time GPS and speed data transmission.
- **Admin Support**: Direct reporting system for traffic, delays, or mechanical issues.
- **SOS Emergency Hub**: Instant emergency trigger for driver safety.

### 📊 Admin Dashboard
- **Fleet Analytics**: Prediction accuracy tracking using MAE (Mean Absolute Error) and RMSE metrics.
- **Ridership Heatmaps**: Visual density tracking at every stop to optimize bus allocation.
- **Maintenance Tracking**: Monitor vehicle health and fuel consumption.
- **Live Fleet Control**: Real-time status of every bus in the fleet.

---

## 🛠️ Technology Stack

- **Backend**: FastAPI (Python), SQLAlchemy, SQLite, WebSockets.
- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons.
- **Mapping**: Leaflet.js, OSRM (Open Source Routing Machine).
- **Simulation**: Custom multi-threaded Python simulators for real-world route modeling.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/AnandhaKaarthick/college-bus-tracker.git
   cd college-bus-tracker
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   python master_reset.py  # Initializes the database with sample data
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

You can start the entire ecosystem (Backend, Frontend, and Simulators) with a single command from the root directory:

```bash
python run_app.py
```

- **Website**: `http://localhost:5173`
- **API Docs**: `http://localhost:8000/docs`

---

## 📂 Project Structure

```text
├── backend/            # FastAPI Server & Database Logic
├── frontend/           # React Frontend (Vite)
├── simulator/          # Python agents for live bus simulation
├── run_app.py          # Orchestration script to run all services
└── master_reset.py     # Database initialization & seeding script
```

---

## 🛡️ Safety & SOS
The system includes a robust Safety Hub for students and an SOS trigger for drivers, ensuring that emergency contacts and campus security are notified immediately during incidents with live location data.

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is licensed under the MIT License.

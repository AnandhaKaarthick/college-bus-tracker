import subprocess
import time
import sys
import os

def run_command(command, cwd=None, env=None):
    return subprocess.Popen(command, shell=True, cwd=cwd, env=env)

def main():
    print("🚀 Starting Bus Tracker Map Application...")
    
    # Prepare environment for backend
    backend_env = os.environ.copy()
    backend_env["PYTHONPATH"] = os.path.join(os.getcwd(), "backend")
    
    # 1. Start Backend
    print("📡 Starting Backend (FastAPI)...")
    backend_proc = run_command("uvicorn main:app --reload --port 8000", cwd="backend", env=backend_env)
    
    # 2. Start Frontend
    print("🌐 Starting Frontend (Vite)...")
    # Note: Using npm.cmd for Windows compatibility
    frontend_proc = run_command("npm run dev", cwd="frontend")
    
    # Give backend a moment to initialize
    time.sleep(3)
    
    # 3. Start Simulators
    print("🚌 Starting Simulator 1 (Ayapakkam)...")
    sim1_proc = run_command("python simulator/main.py --route ayapakkam_rit.json --bus 1")
    
    print("🚌 Starting Simulator 2 (JJ Nagar)...")
    sim2_proc = run_command("python simulator/main.py --route jj_nagar_rit.json --bus 2")
    
    print("\n✅ All systems online!")
    print("   - Website: http://localhost:5173")
    print("   - API Docs: http://localhost:8000/docs")
    print("\nPress Ctrl+C to stop all services.\n")

    try:
        # Keep the script running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n🛑 Shutting down services...")
        # Terminate all processes
        for proc in [backend_proc, frontend_proc, sim1_proc, sim2_proc]:
            proc.terminate()
        print("👋 Goodbye!")

if __name__ == "__main__":
    main()

# MINDORA — One-Click Hosting & Setup Guide

This guide explains how to transfer and run MINDORA on any other computer with **zero manual configuration**.

---

## METHOD 1: Docker Setup (Recommended — 1-Click Zero Dependency)

If the target computer has **Docker Desktop** installed, you don't even need Node.js or MongoDB installed.

### Step-by-Step:
1. **Copy the project folder** (`mindo`) to the target machine.
2. Ensure **Docker Desktop** is open and running.
3. **To START**: Double-click `DOCKER_START.bat`.
   - Docker will automatically build the app, set up MongoDB, start the server, and open `http://localhost:3000` in your browser.
4. **To STOP**: Double-click `DOCKER_STOP.bat`.
5. **Next Day / Restart**: Just double-click `DOCKER_START.bat` again. All registration data is safely preserved in Docker volumes.

---

## METHOD 2: Windows Batch Setup (No Docker required)

If the target machine runs standard Windows with Node.js and MongoDB installed:

### Step-by-Step:
1. **Copy the project folder** (`mindo`) to the target machine.
2. **To START**: Double-click `START_MINDORA.bat`.
   - The script automatically checks and installs any missing `npm` dependencies, builds the frontend if needed, starts MongoDB, launches the MINDORA server, and opens `http://localhost:3000`.
3. **To STOP**: Double-click `STOP_MINDORA.bat`.
4. **Next Day / Restart**: Double-click `START_MINDORA.bat` again.

---

## Accessing from other devices on the same Wi-Fi / LAN network:
- Open command prompt and run `ipconfig` to find your LAN IPv4 Address (e.g. `192.168.1.50`).
- Other tablets/phones/laptops on the same network can access:
  - **Operator Desk**: `http://<YOUR_IP>:3000/register`
  - **Live TV Display**: `http://<YOUR_IP>:3000/display`
  - **Connect / QR**: `http://<YOUR_IP>:3000/connect`

# MINDORA — Microbiology Exhibition
## Offline LAN Registration & Event Management System

![MINDORA Logo](client/public/assets/mindora-logo.png)

A high-performance, offline-first, multi-device LAN registration and event management system built specifically for the **MINDORA Microbiology Exhibition**. 

Designed for zero internet dependency, the system runs centrally on an **Admin Laptop** and serves multiple registration desks (phones, tablets, and laptops) over a local Wi-Fi router or Windows Mobile Hotspot.

---

## 🔬 Key Capabilities

- **100% Offline Architecture**: Operates with zero internet connection. All authentication, database storage, Socket.IO real-time synchronization, and exports run on the local LAN.
- **Ultra-Fast Registration Form**: 5–10 second turnaround time per student with keyboard shortcuts, auto-focus, and Sri Lankan phone format validation.
- **Automatic O/L & A/L Level Classification**:
  - **Grade 6–11** $\rightarrow$ **O/L** (Ordinary Level)
  - **Grade 12–13** $\rightarrow$ **A/L** (Advanced Level)
  - Strict backend validation with real-time level badge.
- **Instant In-Modal School Addition**: Operators can search schools with a fuzzy dropdown or add missing schools in-place without navigating away.
- **Socket.IO Real-Time Sync**: When any desk creates a school or registers a student, all connected devices and admin monitors update immediately without refreshing.
- **Two-Day Exhibition Filtering**: Full separation and comparative reporting between **Day 1 (14 Sep 2026)**, **Day 2 (15 Sep 2026)**, and **Combined Totals**.
- **Multi-Sheet Excel, CSV & Official PDF Exports**: Generate comprehensive Excel workbooks, CSV datasets, and branded printable university reports.
- **Role-Based Security**: Strict access control for **Administrator**, **Registration Operator**, and **Viewer** roles.
- **Offline Backup & Safety Restore**: Native collection snapshots stored in `/backups/` with automated safety backups prior to restore operations.
- **Live Display Mode (`/display`)**: High-contrast, privacy-safe live visitor counter for TVs and projectors.
- **QR Code Onboarding (`/connect`)**: Instant phone onboarding by scanning the generated local LAN QR code.

---

## 🏗️ Architecture

```
                  MINDORA LOCAL NETWORK (Wi-Fi / Hotspot)
                                     |
    +--------------------------------+--------------------------------+
    |                                |                                |
DESK 01 (Phone)              DESK 02 (Tablet)                 DESK 03 (Laptop)
Operator: Kasun              Operator: Sanduni                Operator: Nimal
    |                                |                                |
    +--------------------------------+--------------------------------+
                                     |
                      ADMIN LAPTOP (0.0.0.0:3000)
                                     |
               +---------------------+---------------------+
               |                                           |
      Node.js + Express API                       MongoDB Community
     (Static React SPA + Sockets)                  (Local Database)
               |                                           |
        ADMIN DASHBOARD                             DATA PERSISTENCE
```

---

## 🚀 Quick Start on Windows

### 1. Prerequisites
- **Node.js**: v18.0 or higher ([Download Node.js](https://nodejs.org))
- **MongoDB Community Server**: Running locally on `127.0.0.1:27017` ([Download Mongodb ](https://www.mongodb.com/try/download/community))

### 2. Start the Application
Simply double-click:
```bat
START_MINDORA.bat
```
This script will:
1. Verify Node.js and MongoDB services.
2. Detect the primary LAN IP (e.g. `192.168.1.10` or `192.168.137.1`).
3. Launch the server on `0.0.0.0:3000`.
4. Open the browser to `http://localhost:3000`.

### 3. Stop the Application
Double-click:
```bat
STOP_MINDORA.bat
```

---

## 📱 Connecting Registration Phones & Desks

### Method A: Windows Mobile Hotspot (Recommended for field setup)
1. On the Admin Laptop, go to **Windows Settings $\rightarrow$ Network & Internet $\rightarrow$ Mobile Hotspot**.
2. Turn on **Mobile Hotspot** (Set SSID e.g. `MINDORA-WIFI` and a password).
3. Connect all registration phones and tablets to `MINDORA-WIFI`.
4. On the Admin Laptop, open `http://localhost:3000/connect`.
5. Point registration phone cameras to scan the displayed QR code (or type the URL e.g. `http://192.168.137.1:3000/register`).
6. Log in with the assigned operator credentials (e.g. `desk01`, `desk02`).

### Method B: Local Wi-Fi Router
1. Connect the Admin Laptop and all phones to the same Wi-Fi router.
2. Open `http://localhost:3000/connect` and scan the QR code from the phones.

---

## 🛡️ Windows Firewall Configuration

If phones cannot open the URL, allow Port 3000 through Windows Firewall:

1. Open **Command Prompt as Administrator**.
2. Run the following command:
```cmd
netsh advfirewall firewall add rule name="MINDORA LAN Server" dir=in action=allow protocol=TCP localport=3000
```

---

## 🔑 Default Accounts & Credentials

Run `npm run seed` to initialize test data:

| Role | Username | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Full system control, analytics, backups, reports |
| **Registration Desk 01** | `desk01` | `desk123` | Fast student registration & school creation |
| **Registration Desk 02** | `desk02` | `desk123` | Fast student registration & school creation |
| **Registration Desk 03** | `desk03` | `desk123` | Fast student registration & school creation |
| **Viewer** | `viewer` | `view123` | Live telemetry & dashboard monitor |

---

## 📋 Event-Day Operating Procedures

### Before the Exhibition Starts
1. Start Admin Laptop and launch `START_MINDORA.bat`.
2. Verify MongoDB status shows **CONNECTED**.
3. Open `http://localhost:3000/connect` and display QR code.
4. Connect all desk phones and log in to `desk01`, `desk02`, etc.
5. Project `http://localhost:3000/display` onto the public exhibition hall TV/monitor.
6. Verify test registration and in-modal school creation.

### During the Exhibition
- Operators enter: **Student Name**, select **School** (or click `+ Add Missing School`), select **Grade** (6–13), optional **Phone**, and hit **Enter / Register Student**.
- The system automatically classifies O/L vs A/L, increments sequential registration number (`MIN-XXXXXX`), broadcasts the update via Socket.IO, and focuses the Name input for the next student.

### End of Exhibition Checklist
1. Open Admin Dashboard $\rightarrow$ **Settings $\rightarrow$ End-of-Event Checklist**.
2. Download **Excel Workbook (.xlsx)** (5 sheets: Registrations, Summary, Schools, Grades, Desks).
3. Download **Official PDF Report**.
4. Download **CSV Archive**.
5. Go to **Backups $\rightarrow$ Backup Database Now**.
6. Copy the generated `.json` backup file from `/backups/` to a USB drive.
7. Safely stop the server using `STOP_MINDORA.bat`.

---

## 🧪 Automated Acceptance Testing

Run the test suite to verify all 36 critical acceptance requirements:
```bash
npm test
```
The suite verifies:
- Role permissions & bcrypt authentication.
- Exact Grade-to-Level mapping (6–11 $\rightarrow$ O/L, 12–13 $\rightarrow$ A/L).
- Monotonic atomic sequential IDs (`MIN-000001`, `MIN-000002`...) under concurrent load.
- Case-insensitive duplicate school prevention.
- In-place school addition & real-time Socket broadcasting.
- Day 1 vs Day 2 filtering across all aggregations.
- Level recalculation when grade is edited.
- Soft deletion & audit logging.
- Excel, PDF, and CSV generators.
- Full backup & restore cycles.

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express.js, Socket.IO, MongoDB Community Edition, Mongoose, ExcelJS, PDFKit, QRCode, Helmet, Rate Limiter.
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Recharts, Axios.
- **Architecture**: Single unified server running on `0.0.0.0:3000` serving the production SPA and REST/Socket API.

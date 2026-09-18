# MINDORA — Free Online Hosting & Offline Setup Guide

MINDORA is built as a **Dual Hybrid System**:
1. **OFFLINE (Local LAN & Desktop App)**: Runs completely offline without internet using local MongoDB and local Wi-Fi router or `MINDORA.exe`.
2. **ONLINE (Free Web Cloud Hosting)**: Can be deployed 100% FREE to the internet so anyone anywhere can open `https://your-mindora-app.onrender.com`.

---

## PART 1: Free Online Cloud Deployment (5-Minute Setup)

You can host MINDORA online for **100% FREE** using **Render.com** (Web App Hosting) + **MongoDB Atlas** (Free Database Cloud).

### Step 1: Create Free MongoDB Cloud Database (MongoDB Atlas)
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and register a free account.
2. Click **Create Cluster** -> Choose the **FREE M0 Cluster**.
3. Under **Database Access**: Create a database user (e.g. username: `mindora_admin`, password: `your_password`).
4. Under **Network Access**: Click **Add IP Address** -> Select **Allow Access from Anywhere (`0.0.0.0/0`)**.
5. Click **Connect** -> **Drivers** -> Copy your connection string:
   `mongodb+srv://mindora_admin:<password>@cluster0.mongodb.net/mindora?retryWrites=true&w=majority`

### Step 2: Deploy to Render.com (100% Free Hosting)
1. Push your MINDORA project folder to **GitHub** (or GitLab).
2. Go to [render.com](https://render.com) and log in with GitHub.
3. Click **New +** -> **Web Service**.
4. Select your `mindora` repository.
5. Set the following settings:
   - **Name**: `mindora-exhibition` (or any name you choose)
   - **Environment**: `Node`
   - **Build Command**: `npm install && cd client && npm install && npm run build`
   - **Start Command**: `node server/server.js`
   - **Instance Type**: `Free`
6. Under **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = `mindora_secret_key_2026`
   - `MONGODB_URI` = `mongodb+srv://mindora_admin:your_password@cluster0.mongodb.net/mindora?retryWrites=true&w=majority` (your connection string from Step 1)
7. Click **Create Web Service**.

🎉 **Done!** In 2 minutes, your app will be live at:
`https://mindora-exhibition.onrender.com`

---

## PART 2: Offline Local LAN & Desktop Mode (No Internet Needed)

If you are at an exhibition hall with **NO INTERNET**:

1. Simply double-click **`MINDORA.exe`** or **`START_MINDORA.bat`**.
2. The server runs offline on your local computer (`http://localhost:3000`).
3. Other laptops/tablets/phones connect via local Wi-Fi router IP (`http://192.168.1.X:3000/register`).
4. Data is stored in your local MongoDB database (`mongodb://127.0.0.1:27017/mindora`).

---

## Summary of Dual Modes:

| Mode | Where Database Lives | Internet Required? | How to Access |
|---|---|---|---|
| **OFFLINE LAN** | Local Computer (MongoDB) | ❌ NO | `MINDORA.exe` or `http://<LOCAL_IP>:3000` |
| **ONLINE CLOUD** | MongoDB Atlas (Free Cloud) | ✅ YES | `https://your-app.onrender.com` |

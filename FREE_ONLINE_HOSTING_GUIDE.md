# MINDORA — 100% Free Online Hosting Guide (NO CREDIT CARD REQUIRED)

If you want to host MINDORA online for FREE **without giving any credit card details**, use **Vercel** or **Koyeb** + **MongoDB Atlas**.

---

## 🌟 METHOD 1: Deploy to Vercel (100% FREE — NO CREDIT CARD)

Vercel is the world's most popular free cloud platform for web applications. **No credit card is ever required.**

### Step 1: Create Free MongoDB Database (MongoDB Atlas)
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and register for free. (No credit card needed).
2. Click **Create Cluster** -> Select **M0 FREE Cluster**.
3. Create a Database User (e.g. `mindora_user` with password `your_password`).
4. Under **Network Access**: Add IP `0.0.0.0/0` (Allow from anywhere).
5. Click **Connect** -> Copy connection string:
   `mongodb+srv://mindora_user:<password>@cluster0.mongodb.net/mindora?retryWrites=true&w=majority`

### Step 2: Deploy to Vercel
1. Push your MINDORA project folder to **GitHub**.
2. Go to [vercel.com](https://vercel.com) and log in with your GitHub account. (No credit card required).
3. Click **Add New...** -> **Project**.
4. Select your `mindora` repository.
5. Under **Environment Variables**, add:
   - `MONGODB_URI` = your connection string from Step 1
   - `JWT_SECRET` = `mindora_secret_key_2026`
6. Click **Deploy**.

🎉 **Done!** Your MINDORA app is now live online at:
`https://your-app-name.vercel.app`

---

## 🌟 METHOD 2: Deploy to Koyeb (100% FREE — NO CREDIT CARD)

Koyeb offers free container web hosting with **no credit card required**.

1. Sign up for a free account at [koyeb.com](https://www.koyeb.com).
2. Click **Create Web Service**.
3. Select GitHub and choose your `mindora` repo.
4. Set environment variables (`MONGODB_URI` & `JWT_SECRET`).
5. Click **Deploy**.

---

## Summary of Free No-Card Platforms:

| Platform | Credit Card Required? | Free Tier | Speed |
|---|---|---|---|
| **Vercel** | ❌ **NO** | 100% Free Forever | ⚡ Extremely Fast |
| **Koyeb** | ❌ **NO** | 100% Free Tier | ⚡ Fast |
| **MongoDB Atlas** | ❌ **NO** | 512MB Free DB | ⚡ Fast |
| **Render** | ⚠️ Yes (on some accounts) | Free Tier | Standard |

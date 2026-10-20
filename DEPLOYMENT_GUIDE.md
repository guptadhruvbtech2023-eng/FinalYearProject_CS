# Complete Guide to Deploying NexusAnalytics for Free

This guide walks you through deploying the **NexusAnalytics** full-stack platform (**FastAPI backend + React/Vite frontend + Machine Learning Engine**) 100% free with no credit card required.

---

## Architecture Overview

```
                      ┌──────────────────────────────────────────────┐
                      │              GITHUB REPOSITORY               │
                      │ (guptadhruvbtech2023-eng/FinalYearProject_CS)│
                      └──────────────┬───────────────────────────────┘
                                     │
             ┌───────────────────────┴───────────────────────┐
             ▼                                               ▼
┌─────────────────────────┐                     ┌─────────────────────────┐
│     VERCEL (FREE)       │                     │      RENDER (FREE)      │
│    Frontend (React)     │                     │     Backend (FastAPI)   │
│ • Blazing Fast CDN      │                     │ • 512MB RAM Web Service │
│ • 0s Cold Start         │                     │ • Free SSL HTTPS        │
│ • Automatic Deployments │                     │ • Auto Dataset Loading  │
└────────────┬────────────┘                     └────────────┬────────────┘
             │                                               │
             └────────────── REST API / WebSocket ───────────┘
```

---

## Method 1: Vercel (Frontend) + Render (Backend) — **Recommended**

This is the industry-standard setup for modern web applications. The frontend loads instantly from edge servers worldwide, and communicates with your Python backend.

### Step 1: Push Your Code to GitHub

Make sure all changes are committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "Configure production deployment settings for Vercel and Render"
git push origin main
```

---

### Step 2: Deploy Backend to Render (Free)

1. Go to **[Render.com](https://render.com/)** and sign up or log in (choose **Continue with GitHub**).
2. On your Render dashboard, click **New +** and select **Web Service**.
3. Select **Build and deploy from a Git repository** and connect your GitHub account.
4. Pick your repository: `FinalYearProject_CS`.
5. Fill in the following settings:
   - **Name**: `nexusanalytics-backend` (or any name you prefer)
   - **Region**: Choose the closest region (e.g., `Singapore`, `Frankfurt`, or `Oregon`)
   - **Branch**: `main`
   - **Root Directory**: *(Leave empty)*
   - **Runtime**: `Python 3`
   - **Build Command**: 
     ```bash
     pip install -r backend/requirements.txt
     ```
   - **Start Command**: 
     ```bash
     uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type**: Select **Free** ($0/month, 512 MB RAM, 0.1 CPU).
6. Under **Environment Variables**, add:
   - `PYTHON_VERSION`: `3.11.4`
   - *(Optional)* `OPENAI_API_KEY`: *(Only if you want cloud LLM features; otherwise the offline Statistical NLP analyst is used automatically)*
7. Click **Deploy Web Service**.
8. Wait 2–3 minutes for the build to complete.
9. Once the status shows **Live**, copy your backend URL. It will look like:
   ```
   https://nexusanalytics-backend.onrender.com
   ```
10. **Test the Backend**: Open your browser and navigate to `https://nexusanalytics-backend.onrender.com/`. You should see a JSON health check:
    ```json
    {
      "status": "online",
      "service": "Data Analytics with AI Integration",
      "version": "1.0.0",
      "dataset_loaded": true,
      "rows": 9994,
      "columns": 21
    }
    ```

---

### Step 3: Deploy Frontend to Vercel (Free)

1. Go to **[Vercel.com](https://vercel.com/)** and sign up or log in (choose **Continue with GitHub**).
2. Click **Add New...** > **Project**.
3. Import your repository: `FinalYearProject_CS`.
4. Configure the project:
   - **Project Name**: `nexusanalytics` (or any name you like)
   - **Framework Preset**: Select **Vite**
   - **Root Directory**: Click **Edit** and choose `frontend`
   - **Build and Output Settings**: Leave as default (`npm run build` and `dist`)
5. Expand **Environment Variables** and add:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://nexusanalytics-backend.onrender.com/api` *(replace with your actual Render backend URL from Step 2, appending `/api`)*
6. Click **Deploy**.
7. In about 30–60 seconds, Vercel will complete the build and give you a live production URL:
   ```
   https://nexusanalytics.vercel.app
   ```

---

## Method 2: All-in-One on Render (Using Blueprint)

If you prefer managing both backend and frontend inside a single dashboard on Render:

1. Push the repository containing `render.yaml` to GitHub.
2. Go to **[Render Dashboard](https://dashboard.render.com/)**.
3. Click **New +** > **Blueprint**.
4. Connect your repository `FinalYearProject_CS`.
5. Render will detect `render.yaml` and show:
   - `nexusanalytics-backend` (Web Service)
   - `nexusanalytics-frontend` (Static Site)
6. Click **Apply**.
7. Once deployed, get the backend URL, go to the frontend Static Site settings, add `VITE_API_BASE_URL`, and click **Manual Deploy** > **Clear build cache & deploy**.

---

## Understanding Free Tier Behavior & Best Practices

### Cold Starts (Render Free Tier)
- **What happens**: To keep services 100% free, Render puts web services to sleep after **15 minutes of inactivity**.
- **When waking up**: When a visitor accesses the app after it was sleeping, the first request will take **30 to 50 seconds** to boot the backend container.
- **Once awake**: All subsequent operations, machine learning training, and charts load in milliseconds.
- **How to prevent sleep (Optional)**:
  You can set up a free uptime monitor (e.g., [cron-job.org](https://cron-job.org/) or [UptimeRobot](https://uptimerobot.com/)) to send a GET ping to `https://your-backend.onrender.com/` every 10 minutes.

### Memory Optimization
- Render's free tier provides **512 MB RAM**.
- The `superstore.csv` dataset (~15.8 MB) takes roughly ~60 MB RAM in Pandas.
- The base FastAPI + Scikit-Learn process uses ~150–200 MB RAM.
- Total memory footprint sits safely around ~250–280 MB, well within the 512 MB limit.

---

## Post-Deployment Verification Checklist

- [ ] Visit `https://<your-backend>.onrender.com/` and confirm `"status": "online"` and `"dataset_loaded": true`.
- [ ] Visit your Vercel frontend URL.
- [ ] Check the **Dashboard** page — KPIs, charts, and filter bars should load data.
- [ ] Visit **Data Cleaning** — test running an outlier inspection or preview.
- [ ] Visit **Predictions & ML** — run a model training cycle and verify metrics update.
- [ ] Test a report export (PDF / Excel / CSV download links).

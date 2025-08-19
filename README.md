Excel Insights Dashboard – Upload. Analyze. Decide.

Overview

Full‑stack platform to upload Excel/CSV files and instantly get interactive insights. Backend (FastAPI + Pandas) processes data and serves chart‑ready JSON. Frontend (React + Vite + Tailwind + Recharts) renders an elegant dashboard with dark mode, filters, and export options.

Tech Stack

- Frontend: React, Vite, Tailwind CSS, Recharts, Axios, react-router-dom, html-to-image, jsPDF
- Backend: FastAPI, Uvicorn, Pandas, NumPy, OpenPyXL, python-multipart

Getting Started

Prerequisites

- Node.js 18+
- Python 3.10+

1) Backend setup

```
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

2) Frontend setup

```
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

Environment

- Frontend reads API base from VITE_API_URL. Defaults to http://127.0.0.1:8000 via `.env.development`.

Features

- Upload .xlsx/.csv with progress
- Auto type detection: numeric, categorical, datetime
- Summary stats & correlations
- Auto charts: bar, pie, line, scatter, heatmap
- Choose columns to build charts
- Export dashboard as PNG/PDF
- Download processed CSV
- Dark/Light mode

Project Structure

```
backend/
  main.py
  processing.py
  dataset_store.py
  requirements.txt
frontend/
  index.html
  vite.config.js
  package.json
  postcss.config.js
  tailwind.config.js
  .env.development
  src/
    main.jsx
    App.jsx
    index.css
    api.js
    components/
      Layout.jsx
      DarkModeToggle.jsx
      KpiCard.jsx
      ChartCard.jsx
      Heatmap.jsx
    pages/
      Upload.jsx
      Dashboard.jsx
      Summary.jsx
      Export.jsx
```

Notes

- This is a developer-friendly MVP. The backend stores uploaded datasets in memory with a temporary ID and saves a CSV copy in `backend/.data`. For production, use persistent storage and auth.



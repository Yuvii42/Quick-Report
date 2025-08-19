from __future__ import annotations

import io
import os
from typing import Any, Dict

import pandas as pd
from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from dataset_store import store
from processing import (
    build_chart_data,
    compute_correlations,
    compute_summary,
    generate_default_charts,
    infer_column_types,
)
from db import Base, engine, SessionLocal
from models import Dataset, User
from sqlalchemy.orm import Session
from auth import (
    get_current_user,
    get_db,
    get_password_hash,
    verify_password,
    create_access_token,
)
from fastapi.security import OAuth2PasswordRequestForm


app = FastAPI(title="Excel Insights Dashboard API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


DATA_DIR = os.path.join(os.path.dirname(__file__), ".data")
os.makedirs(DATA_DIR, exist_ok=True)

# Initialize DB
Base.metadata.create_all(bind=engine)


def assert_user_owns_dataset(dataset_id: str, user: User, db: Session) -> None:
    ds = db.query(Dataset).filter(Dataset.dataset_id == dataset_id, Dataset.owner_id == user.id).first()
    if ds is None:
        raise HTTPException(status_code=404, detail="Dataset not found")


@app.get("/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


class UserCreate(BaseModel):
    email: str
    password: str


@app.post("/auth/signup")
def signup(payload: UserCreate, db: Session = Depends(get_db)) -> JSONResponse:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=payload.email, password_hash=get_password_hash(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    return JSONResponse({"access_token": token, "token_type": "bearer"})


@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> JSONResponse:
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    token = create_access_token({"sub": str(user.id)})
    return JSONResponse({"access_token": token, "token_type": "bearer"})


@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    filename = file.filename or "uploaded"
    ext = (os.path.splitext(filename)[1] or "").lower()

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")

    try:
        if ext in (".xlsx", ".xls"):
            df = pd.read_excel(io.BytesIO(content), engine="openpyxl")
        elif ext == ".csv" or not ext:
            df = pd.read_csv(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {exc}") from exc

    # Basic cleaning: strip column names, drop fully empty columns
    df.columns = [str(c).strip() for c in df.columns]
    df = df.dropna(axis=1, how="all")

    # Infer types and compute insights
    column_types = infer_column_types(df)
    summary = compute_summary(df, column_types)
    charts = generate_default_charts(df, column_types)
    correlations = compute_correlations(df, column_types)

    # Store and persist CSV copy
    dataset_id = store.save(df)
    csv_path = os.path.join(DATA_DIR, f"{dataset_id}.csv")
    try:
        df.to_csv(csv_path, index=False)
    except Exception:
        pass

    # Record dataset metadata in DB
    db_ds = Dataset(dataset_id=dataset_id, filename=filename, row_count=int(len(df)), owner_id=current_user.id)
    db.add(db_ds)
    db.commit()

    payload: Dict[str, Any] = {
        "datasetId": dataset_id,
        "columns": [{"name": c, "type": column_types[c]} for c in df.columns],
        "summary": summary,
        "charts": charts,
        "correlations": correlations,
        "filename": filename,
        "rowCount": int(len(df)),
    }
    return JSONResponse(payload)


@app.get("/summary/{dataset_id}")
def get_summary(dataset_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> JSONResponse:
    assert_user_owns_dataset(dataset_id, current_user, db)
    df = store.get(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    column_types = infer_column_types(df)
    summary = compute_summary(df, column_types)
    return JSONResponse({"datasetId": dataset_id, "summary": summary})


@app.get("/charts/{dataset_id}")
def get_charts(dataset_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> JSONResponse:
    assert_user_owns_dataset(dataset_id, current_user, db)
    df = store.get(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    column_types = infer_column_types(df)
    charts = generate_default_charts(df, column_types)
    return JSONResponse({"datasetId": dataset_id, "charts": charts})


@app.get("/chart-data/{dataset_id}")
def get_chart_data(
    dataset_id: str,
    chart: str = Query(..., description="bar|pie|line|scatter|heatmap"),
    x: str | None = None,
    y: str | None = None,
    agg: str = "sum",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    assert_user_owns_dataset(dataset_id, current_user, db)
    df = store.get(dataset_id)
    if df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    data = build_chart_data(df, chart_type=chart, x=x, y=y, agg=agg)
    return JSONResponse({"datasetId": dataset_id, "chart": chart, "data": data})


@app.get("/download/{dataset_id}")
def download_csv(dataset_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> FileResponse:
    assert_user_owns_dataset(dataset_id, current_user, db)
    csv_path = os.path.join(DATA_DIR, f"{dataset_id}.csv")
    df = store.get(dataset_id)
    if df is None and not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail="Dataset not found")

    if not os.path.exists(csv_path) and df is not None:
        try:
            df.to_csv(csv_path, index=False)
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Failed to export CSV: {exc}") from exc

    return FileResponse(csv_path, media_type="text/csv", filename=f"dataset_{dataset_id}.csv")



from __future__ import annotations

from typing import Any, Dict, List, Tuple

import numpy as np
import pandas as pd
from pandas.api.types import (
    is_bool_dtype,
    is_datetime64_any_dtype,
    is_numeric_dtype,
)


def infer_column_types(df: pd.DataFrame) -> Dict[str, str]:
    """Infer simple column types: numeric, categorical, datetime, boolean, text."""
    types: Dict[str, str] = {}
    for col in df.columns:
        series = df[col]

        if is_datetime64_any_dtype(series):
            types[col] = "datetime"
            continue

        if is_bool_dtype(series):
            types[col] = "boolean"
            continue

        if is_numeric_dtype(series):
            types[col] = "numeric"
            continue

        # Try to parse dates from object-like columns
        if series.dtype == object:
            sample = series.dropna().astype(str).head(200)
            try:
                parsed = pd.to_datetime(sample, errors="raise", utc=False, infer_datetime_format=True)
                # If reasonable proportion parsed, treat as datetime
                if len(parsed) >= max(3, int(0.6 * len(sample))):
                    types[col] = "datetime"
                    df[col] = pd.to_datetime(df[col], errors="coerce")
                    continue
            except Exception:
                pass

            # If unique values are small relative to total, treat as categorical
            unique_ratio = series.nunique(dropna=True) / max(1, len(series))
            if unique_ratio < 0.2:
                types[col] = "categorical"
            else:
                types[col] = "text"
        else:
            types[col] = "text"

    return types


def compute_summary(df: pd.DataFrame, column_types: Dict[str, str]) -> Dict[str, Any]:
    """Compute basic dataset and per-column summaries."""
    summary: Dict[str, Any] = {
        "rows": int(len(df)),
        "columns": int(len(df.columns)),
        "missing_values": int(df.isna().sum().sum()),
        "columns_meta": [],
    }

    for col in df.columns:
        col_type = column_types.get(col, "text")
        col_summary: Dict[str, Any] = {"name": col, "type": col_type}

        series = df[col]
        non_null = series.dropna()

        if col_type == "numeric":
            col_summary.update(
                {
                    "count": int(non_null.count()),
                    "sum": try_float(non_null.sum()),
                    "mean": try_float(non_null.mean()),
                    "median": try_float(non_null.median()),
                    "min": try_float(non_null.min()),
                    "max": try_float(non_null.max()),
                    "std": try_float(non_null.std()),
                }
            )
        elif col_type in ("categorical", "boolean", "text"):
            top = non_null.value_counts().head(5)
            col_summary.update(
                {
                    "unique": int(non_null.nunique()),
                    "top": [{"value": str(idx), "count": int(cnt)} for idx, cnt in top.items()],
                }
            )
        elif col_type == "datetime":
            col_summary.update(
                {
                    "min": safe_iso(non_null.min()),
                    "max": safe_iso(non_null.max()),
                }
            )

        summary["columns_meta"].append(col_summary)

    # KPIs: attempt to pick a numeric column for total and average
    numeric_cols = [c for c, t in column_types.items() if t == "numeric"]
    kpis: Dict[str, Any] = {}
    if numeric_cols:
        first_num = numeric_cols[0]
        kpis["sum_of_" + first_num] = try_float(df[first_num].sum())
        kpis["avg_of_" + first_num] = try_float(df[first_num].mean())
    summary["kpis"] = kpis

    return summary


def compute_correlations(df: pd.DataFrame, column_types: Dict[str, str]) -> Dict[str, Any]:
    numeric_cols = [c for c, t in column_types.items() if t == "numeric"]
    if len(numeric_cols) < 2:
        return {"columns": numeric_cols, "matrix": []}

    corr = df[numeric_cols].corr(numeric_only=True).fillna(0.0)
    return {
        "columns": list(corr.columns),
        "matrix": corr.values.round(4).tolist(),
    }


def generate_default_charts(df: pd.DataFrame, column_types: Dict[str, str]) -> Dict[str, Any]:
    charts: Dict[str, Any] = {}

    categorical_cols = [c for c, t in column_types.items() if t in ("categorical", "boolean")]
    datetime_cols = [c for c, t in column_types.items() if t == "datetime"]
    numeric_cols = [c for c, t in column_types.items() if t == "numeric"]

    # Bar/Pie: top categories of first categorical
    if categorical_cols:
        cat = categorical_cols[0]
        top = df[cat].astype(str).value_counts().head(10)
        data = [{"name": str(k), "value": int(v)} for k, v in top.items()]
        charts["bar_top_categories"] = {"xKey": "name", "yKey": "value", "data": data, "column": cat}
        charts["pie_top_categories"] = {"nameKey": "name", "valueKey": "value", "data": data, "column": cat}

    # Line: first datetime vs first numeric (sum by day)
    if datetime_cols and numeric_cols:
        dt = datetime_cols[0]
        num = numeric_cols[0]
        temp = df[[dt, num]].dropna()
        if not is_datetime64_any_dtype(temp[dt]):
            temp[dt] = pd.to_datetime(temp[dt], errors="coerce")
        temp = temp.dropna()
        if not temp.empty:
            by_day = (
                temp.assign(date=temp[dt].dt.date)
                .groupby("date")[num]
                .sum()
                .reset_index()
                .sort_values("date")
            )
            data = [{"date": str(r["date"]), "value": try_float(r[num])} for _, r in by_day.iterrows()]
            charts["line_trend"] = {"xKey": "date", "yKey": "value", "data": data, "xLabel": dt, "yLabel": num}

    # Scatter: first two numerics
    if len(numeric_cols) >= 2:
        x, y = numeric_cols[:2]
        temp = df[[x, y]].dropna().head(2000)  # cap to avoid huge payloads
        data = [{"x": try_float(row[x]), "y": try_float(row[y])} for _, row in temp.iterrows()]
        charts["scatter_correlation"] = {"xKey": "x", "yKey": "y", "data": data, "xLabel": x, "yLabel": y}

    # Heatmap: correlation matrix
    charts["heatmap_correlation"] = compute_correlations(df, column_types)

    return charts


def build_chart_data(
    df: pd.DataFrame,
    chart_type: str,
    x: str | None = None,
    y: str | None = None,
    agg: str = "sum",
) -> Dict[str, Any]:
    """Generate chart data for a requested chart type and columns."""
    chart_type = chart_type.lower()

    if chart_type in ("bar", "pie") and x is not None:
        counts = df[x].astype(str).value_counts().head(20)
        data = [{"name": str(k), "value": int(v)} for k, v in counts.items()]
        if chart_type == "bar":
            return {"xKey": "name", "yKey": "value", "data": data, "column": x}
        return {"nameKey": "name", "valueKey": "value", "data": data, "column": x}

    if chart_type == "line" and x is not None and y is not None:
        temp = df[[x, y]].dropna()
        if not is_datetime64_any_dtype(temp[x]):
            # try parse x as date
            temp[x] = pd.to_datetime(temp[x], errors="coerce")
        temp = temp.dropna()
        if temp.empty:
            return {"xKey": "date", "yKey": "value", "data": []}

        grp = temp.assign(date=temp[x].dt.date).groupby("date")[y]
        agg_map = {"sum": grp.sum, "mean": grp.mean, "count": grp.count}
        func = agg_map.get(agg, grp.sum)
        by_day = func().reset_index().sort_values("date")
        data = [{"date": str(r["date"]), "value": try_float(r[y])} for _, r in by_day.iterrows()]
        return {"xKey": "date", "yKey": "value", "data": data}

    if chart_type == "scatter" and x is not None and y is not None:
        temp = df[[x, y]].dropna().head(5000)
        data = [{"x": try_float(row[x]), "y": try_float(row[y])} for _, row in temp.iterrows()]
        return {"xKey": "x", "yKey": "y", "data": data}

    if chart_type == "heatmap":
        column_types = infer_column_types(df)
        return compute_correlations(df, column_types)

    return {"data": []}


def safe_iso(value: Any) -> str | None:
    if pd.isna(value):
        return None
    try:
        return pd.to_datetime(value).isoformat()
    except Exception:
        return None


def try_float(value: Any) -> float | None:
    try:
        if value is None or (isinstance(value, float) and (np.isnan(value) or np.isinf(value))):
            return None
        return float(value)
    except Exception:
        return None



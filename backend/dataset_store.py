import threading
import uuid
from typing import Dict, Optional

import pandas as pd


class InMemoryDatasetStore:
    """Thread-safe in-memory dataset store keyed by dataset_id."""

    def __init__(self) -> None:
        self._datasets: Dict[str, pd.DataFrame] = {}
        self._lock = threading.Lock()

    def save(self, df: pd.DataFrame) -> str:
        dataset_id = str(uuid.uuid4())
        with self._lock:
            self._datasets[dataset_id] = df
        return dataset_id

    def get(self, dataset_id: str) -> Optional[pd.DataFrame]:
        with self._lock:
            return self._datasets.get(dataset_id)

    def delete(self, dataset_id: str) -> None:
        with self._lock:
            self._datasets.pop(dataset_id, None)

    def list_ids(self) -> Dict[str, int]:
        with self._lock:
            return {k: len(v) for k, v in self._datasets.items()}


store = InMemoryDatasetStore()



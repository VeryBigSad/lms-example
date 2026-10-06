"""
Используем файл diary.json как базу данных
"""

import json
import os
import tempfile
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = Path(os.environ.get("DIARY_DATA_FILE", ROOT / "data" / "diary.json"))
lock = threading.RLock()


def load_data():
    with lock:
        with DATA_FILE.open(encoding="utf-8") as file:
            return json.load(file)


def save_data(data):
    with lock:
        DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
        temporary_file = None
        try:
            with tempfile.NamedTemporaryFile(
                mode="w", encoding="utf-8", dir=DATA_FILE.parent,
                prefix=DATA_FILE.name + ".", suffix=".tmp", delete=False,
            ) as file:
                temporary_file = Path(file.name)
                json.dump(data, file, ensure_ascii=False, indent=2)
                file.write("\n")
            os.replace(temporary_file, DATA_FILE)
        finally:
            if temporary_file is not None:
                temporary_file.unlink(missing_ok=True)


def find_student(data, student_id):
    for student in data["students"]:
        if student["id"] == student_id:
            return student
    return None

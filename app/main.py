import os
import traceback
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse

from app import storage
from app.routers import add_grade, attendance, average, homework, ranking, schedule

ROOT = Path(__file__).resolve().parent
FRONTEND = ROOT.parent / "frontend"
app = FastAPI(title="Перемена — учебный дневник", version="1.0")
app.include_router(average.router)
app.include_router(add_grade.router)
app.include_router(ranking.router)
app.include_router(attendance.router)
app.include_router(homework.router)
app.include_router(schedule.router)


@app.get("/health", include_in_schema=False)
def health():
    return {"status": "ok"}


@app.get("/api/students")
def students():
    data = storage.load_data()
    return {"students": data["students"], "subjects": data["subjects"]}


@app.get("/", include_in_schema=False)
def index():
    return FileResponse(FRONTEND / "index.html", headers={"Cache-Control": "no-store"})


@app.get("/login", include_in_schema=False)
def login_page():
    return FileResponse(FRONTEND / "login.html", headers={"Cache-Control": "no-store"})


@app.get("/assets/{name}", include_in_schema=False)
def asset(name: str):
    if name not in ["styles.css", "login.js", "app.js"]:
        raise HTTPException(status_code=404, detail="Файл не найден.")
    return FileResponse(FRONTEND / name, headers={"Cache-Control": "no-store"})


@app.exception_handler(Exception)
def backend_error(request: Request, error: Exception):
    details = {
        "type": "ServerError",
        "message": "Не удалось выполнить запрос. Подробности — в терминале сервера.",
    }
    if os.environ.get("LESSON_DEBUG") == "1":
        details["type"] = type(error).__name__
        details["message"] = str(error)
        for frame in traceback.extract_tb(error.__traceback__):
            path = Path(frame.filename).resolve()
            if ROOT in path.parents and ".venv" not in path.parts:
                details["file"] = path.relative_to(ROOT.parent).as_posix()
                details["line"] = frame.lineno
    return JSONResponse(status_code=500, content={"error": details})

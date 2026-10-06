from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app import storage

router = APIRouter(prefix="/api", tags=["Добавление оценки"])


class GradeInput(BaseModel):
    student_id: int
    subject: str
    value: Any


def add_grade(data, student_id, subject, value):
    if value not in list(range(2, 5)):
        raise HTTPException(
            status_code=400, detail="Нельзя поставить такую оценку.")
    student = storage.find_student(data, student_id)
    if student is None:
        raise HTTPException(status_code=404, detail="Ученик не найден.")
    student["grades"].append({"subject": subject, "value": value})


@router.post("/grades")
def create_grade(body: GradeInput):
    with storage.lock:
        data = storage.load_data()
        if storage.find_student(data, body.student_id) is None:
            raise HTTPException(status_code=404, detail="Ученик не найден.")
        if body.subject not in data["subjects"]:
            raise HTTPException(status_code=400, detail="Неизвестный предмет.")
        add_grade(data, body.student_id, body.subject, body.value)
        storage.save_data(data)
    return {"message": "Оценка добавлена.", "student_id": body.student_id}

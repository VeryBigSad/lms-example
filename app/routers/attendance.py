from fastapi import APIRouter, HTTPException

from app import storage

router = APIRouter(prefix="/api", tags=["Посещаемость"])


def calculate_attendance(attendance):
    if attendance["total"] == 0:
        return "0"
    return round(attendance["present"] / attendance["total"] * 100, 1)


@router.get("/attendance/{student_id}")
def attendance(student_id: int):
    data = storage.load_data()
    student = storage.find_student(data, student_id)
    if student is None:
        raise HTTPException(status_code=404, detail="Ученик не найден.")
    records = student["attendance"]
    return {
        "percent": calculate_attendance(records),
        "present": records["present"],
        "total": records["total"],
    }

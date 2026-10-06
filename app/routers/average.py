from fastapi import APIRouter, HTTPException

from app import storage

router = APIRouter(prefix="/api", tags=["Средний балл"])


def calculate_average(grades):
    if len(grades) == 0:
        return None
    total = 0
    for grade in grades:
        total += grade["value"]
    return round(total / len(grades), 2)


@router.get("/average/{student_id}")
def average(student_id: int):
    data = storage.load_data()
    student = storage.find_student(data, student_id)
    if student is None:
        raise HTTPException(status_code=404, detail="Ученик не найден.")
    return {
        "average": calculate_average(student["grades"]),
        "count": len(student["grades"]),
    }

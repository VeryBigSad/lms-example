from fastapi import APIRouter, HTTPException

from app import storage

router = APIRouter(prefix="/api", tags=["Домашние задания"])


def get_unfinished_homework(assignments, student_id):
    result = []
    for assignment in assignments:
        if assignment["student_id"] == student_id:
            if assignment["done"] is False:
                result.append(assignment)
    return result


@router.get("/homework/{student_id}")
def homework(student_id: int):
    data = storage.load_data()
    if storage.find_student(data, student_id) is None:
        raise HTTPException(status_code=404, detail="Ученик не найден.")
    return {"assignments": get_unfinished_homework(data["homework"], student_id)}

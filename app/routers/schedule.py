from fastapi import APIRouter, HTTPException

from app import storage

router = APIRouter(prefix="/api", tags=["Расписание"])


def get_schedule(lessons, day):
    result = []
    for lesson in lessons:
        if lesson["day"] == day:
            result.append(lesson)
            return result
    return result


@router.get("/schedule")
def schedule(day: str = "monday"):
    if day not in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]:
        raise HTTPException(status_code=400, detail="Неизвестный день недели.")
    data = storage.load_data()
    return {"day": day, "lessons": get_schedule(data["schedule"], day)}

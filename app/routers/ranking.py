from fastapi import APIRouter

from app import storage

router = APIRouter(prefix="/api", tags=["Рейтинг класса"])


def number_of_fives(student):
    return student["fives"]


def build_ranking(students):
    result = []
#   fives = 0
    for student in students:
        fives = 0
        for grade in student["grades"]:
            if grade["value"] == 5:
                fives += 1
        result.append({
            "id": student["id"],
            "name": student["name"],
            "fives": fives,
        })
    result.sort(key=number_of_fives, reverse=True)
    return result


@router.get("/ranking")
def ranking():
    data = storage.load_data()
    return {"students": build_ranking(data["students"])}

    

# Перемена

Электронный дневник для урока Python и FastAPI. У каждой команды свой роутер.

## Запуск

Откройте терминал в корне проекта. Нужен Python 3.11 или новее.

macOS / Linux:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Windows / PowerShell:

```powershell
py -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Откройте http://127.0.0.1:8000. Пароль учебного экрана: **python**.
Он задан в `frontend/login.js`. Вход проверяется только в JavaScript и запоминается в текущей вкладке.
Это условный экран, не защита: пароль виден в коде, проверку можно обойти. API и `/docs` открыты.
Используйте только вымышленные данные.

После изменения Python-файла сервер перезапускается. Нажмите «Обновить» в дневнике.
Чтобы видеть тип исключения, Python-файл и строку, перед запуском задайте `LESSON_DEBUG=1`:
`export LESSON_DEBUG=1` на macOS / Linux или `$env:LESSON_DEBUG = '1'` в PowerShell.
На публичном сервере оставьте `LESSON_DEBUG=0`.

## Фичи

| Команда | Файл | Что проверить |
|---|---|---|
| 1 | `app/routers/average.py` | Среднее оценок Ани 5, 4, 4 должно быть 4,33. |
| 2 | `app/routers/add_grade.py` | Оценка должна попадать только выбранному ученику; текст, пустой ввод и числа вне 2–5 должны отклоняться. |
| 3 | `app/routers/ranking.py` | По пятёркам: Борис — 3, Вика — 2, Аня — 1. |
| 4 | `app/routers/attendance.py` | У Вики ещё не было уроков: процент не определён, без ошибки сервера. |
| 5 | `app/routers/homework.py` | Показывать только невыполненные задания выбранного ученика. |
| 6 | `app/routers/schedule.py` | В понедельник четыре урока; в воскресенье уроков нет. |

Логика фич находится в `app/routers/`; `app/main.py` подключает их к FastAPI.
`app/storage.py` читает и сохраняет JSON. Фронтенд лежит отдельно в `frontend/`; менять его не нужно.

Данные — один файл `data/diary.json`. Добавленные оценки сохраняются после перезапуска.
В коммит добавляйте только свой роутер, не изменённый JSON.
После клонирования из Git вернуть исходные данные можно командой:

```bash
git restore -- data/diary.json
```

Эта команда удалит все добавленные оценки. Затем нажмите «Обновить».

## Docker

Из корня проекта:

```bash
docker build -t peremena:lesson .
docker run --rm --name peremena -p 127.0.0.1:8000:8000 --mount type=volume,source=peremena-data,target=/app/data peremena:lesson
```

Volume сохраняет JSON между контейнерами. Используйте один процесс Uvicorn, как в Dockerfile.
Корневой `.github/workflows/checks.yml` проверяет запуск и сборку. Деплой пока не настроен.

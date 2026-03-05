import csv
import os
from datetime import date
from pathlib import Path

CSV_PATH = Path(__file__).resolve().parent.parent / "data" / "climbing_gyms.csv"
HEADER = ["이름", "주소", "전화번호", "지역", "최초 수집일"]


def _ensure_csv() -> None:
    CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not CSV_PATH.exists():
        with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(HEADER)


def get_existing_addresses() -> set[str]:
    _ensure_csv()
    with open(CSV_PATH, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return {row["주소"] for row in reader}


def append_new_gyms(new_gyms: list[dict]) -> int:
    existing = get_existing_addresses()
    today = date.today().isoformat()

    rows_to_add = []
    for gym in new_gyms:
        if gym["address"] not in existing:
            rows_to_add.append([
                gym["name"],
                gym["address"],
                gym["telephone"],
                gym["region"],
                today,
            ])

    if rows_to_add:
        with open(CSV_PATH, "a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerows(rows_to_add)

    return len(rows_to_add)

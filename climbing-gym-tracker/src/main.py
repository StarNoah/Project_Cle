from src.naver_search import search_climbing_gyms
from src.csv_store import append_new_gyms


def main() -> None:
    print("클라이밍장 데이터 수집 시작...")

    gyms = search_climbing_gyms()
    print(f"네이버 검색 결과: 총 {len(gyms)}개 클라이밍장 발견")

    added = append_new_gyms(gyms)
    print(f"CSV 업데이트 완료: 신규 {added}건 추가")


if __name__ == "__main__":
    main()

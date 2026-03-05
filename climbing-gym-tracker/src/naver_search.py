import os
import re
import time

import requests

NAVER_CLIENT_ID = os.environ.get("NAVER_CLIENT_ID", "")
NAVER_CLIENT_SECRET = os.environ.get("NAVER_CLIENT_SECRET", "")

# 시/군/구 단위 세분화 검색
DISTRICTS = {
    "서울": [
        "강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구",
        "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구",
        "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구",
    ],
    "경기": [
        "수원시", "성남시", "고양시", "용인시", "부천시", "안산시", "안양시", "남양주시",
        "화성시", "평택시", "의정부시", "시흥시", "파주시", "광명시", "김포시", "군포시",
        "광주시", "이천시", "양주시", "오산시", "구리시", "안성시", "포천시", "의왕시",
        "하남시", "여주시", "양평군", "동두천시", "과천시", "가평군", "연천군",
    ],
    "인천": [
        "중구", "동구", "미추홀구", "연수구", "남동구", "부평구", "계양구", "서구", "강화군", "옹진군",
    ],
    "부산": [
        "중구", "서구", "동구", "영도구", "부산진구", "동래구", "남구", "북구",
        "해운대구", "사하구", "금정구", "강서구", "연제구", "수영구", "사상구", "기장군",
    ],
    "대구": [
        "중구", "동구", "서구", "남구", "북구", "수성구", "달서구", "달성군", "군위군",
    ],
    "대전": ["동구", "중구", "서구", "유성구", "대덕구"],
    "광주": ["동구", "서구", "남구", "북구", "광산구"],
    "울산": ["중구", "남구", "동구", "북구", "울주군"],
    "세종": ["세종시"],
    "강원": [
        "춘천시", "원주시", "강릉시", "동해시", "태백시", "속초시", "삼척시",
        "홍천군", "횡성군", "영월군", "평창군", "정선군", "철원군", "화천군",
        "양구군", "인제군", "고성군", "양양군",
    ],
    "충북": [
        "청주시", "충주시", "제천시", "보은군", "옥천군", "영동군",
        "증평군", "진천군", "괴산군", "음성군", "단양군",
    ],
    "충남": [
        "천안시", "공주시", "보령시", "아산시", "서산시", "논산시", "계룡시", "당진시",
        "금산군", "부여군", "서천군", "청양군", "홍성군", "예산군", "태안군",
    ],
    "전북": [
        "전주시", "군산시", "익산시", "정읍시", "남원시", "김제시",
        "완주군", "진안군", "무주군", "장수군", "임실군", "순창군", "고창군", "부안군",
    ],
    "전남": [
        "목포시", "여수시", "순천시", "나주시", "광양시",
        "담양군", "곡성군", "구례군", "고흥군", "보성군", "화순군", "장흥군",
        "강진군", "해남군", "영암군", "무안군", "함평군", "영광군", "장성군",
        "완도군", "진도군", "신안군",
    ],
    "경북": [
        "포항시", "경주시", "김천시", "안동시", "구미시", "영주시", "영천시", "상주시",
        "문경시", "경산시", "의성군", "청송군", "영양군", "영덕군", "청도군",
        "고령군", "성주군", "칠곡군", "예천군", "봉화군", "울진군", "울릉군",
    ],
    "경남": [
        "창원시", "진주시", "통영시", "사천시", "김해시", "밀양시", "거제시", "양산시",
        "의령군", "함안군", "창녕군", "고성군", "남해군", "하동군", "산청군",
        "함양군", "거창군", "합천군",
    ],
    "제주": ["제주시", "서귀포시"],
}

KEYWORDS = ["클라이밍장", "볼더링", "클라이밍센터", "클라이밍짐"]

API_URL = "https://openapi.naver.com/v1/search/local.json"
DISPLAY = 5
MAX_START = 45


def _strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text)


def _normalize_address(address: str) -> str:
    return re.sub(r"\s+", " ", address).strip()


def _extract_region(address: str) -> str:
    """주소에서 시/도를 추출한다."""
    first = address.split()[0] if address else ""
    return first


def search_climbing_gyms() -> list[dict]:
    """모든 지역/키워드 조합으로 네이버 로컬 검색을 수행하고 중복 제거된 결과를 반환한다."""
    if not NAVER_CLIENT_ID or not NAVER_CLIENT_SECRET:
        raise RuntimeError("NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 환경변수를 설정하세요.")

    headers = {
        "X-Naver-Client-Id": NAVER_CLIENT_ID,
        "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
    }

    seen_addresses: set[str] = set()
    results: list[dict] = []

    for sido, districts in DISTRICTS.items():
        for district in districts:
            for keyword in KEYWORDS:
                query = f"{sido} {district} {keyword}"
                start = 1
                while start <= MAX_START:
                    params = {"query": query, "display": DISPLAY, "start": start}
                    resp = requests.get(API_URL, headers=headers, params=params, timeout=10)
                    resp.raise_for_status()
                    items = resp.json().get("items", [])
                    if not items:
                        break

                    for item in items:
                        address = _normalize_address(item.get("address", ""))
                        if not address or address in seen_addresses:
                            continue
                        seen_addresses.add(address)
                        results.append({
                            "name": _strip_html(item.get("title", "")),
                            "address": address,
                            "telephone": item.get("telephone", ""),
                            "region": _extract_region(address),
                        })

                    start += DISPLAY
                    time.sleep(0.05)

    return results

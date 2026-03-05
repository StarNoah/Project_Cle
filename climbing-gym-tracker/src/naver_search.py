import os
import re
import time

import requests

NAVER_CLIENT_ID = os.environ.get("NAVER_CLIENT_ID", "")
NAVER_CLIENT_SECRET = os.environ.get("NAVER_CLIENT_SECRET", "")

REGIONS = ["서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종"]
KEYWORDS = ["클라이밍장", "볼더링", "클라이밍센터", "클라이밍짐"]

API_URL = "https://openapi.naver.com/v1/search/local.json"
DISPLAY = 5
MAX_START = 45  # 네이버 API 최대 start=45 (display=5 기준 최대 50건)


def _strip_html(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text)


def _normalize_address(address: str) -> str:
    return re.sub(r"\s+", " ", address).strip()


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

    for region in REGIONS:
        for keyword in KEYWORDS:
            query = f"{region} {keyword}"
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
                        "region": region,
                    })

                start += DISPLAY
                time.sleep(0.1)  # API 호출 간 짧은 딜레이

    return results

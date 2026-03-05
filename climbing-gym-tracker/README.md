# 국내 클라이밍장 자동 수집 시스템

네이버 검색 API를 통해 국내 클라이밍장 목록을 자동 수집하고 CSV 파일로 관리하는 시스템입니다.
GitHub Actions를 통해 매일 1회 자동 실행되며, 변경사항은 자동 커밋됩니다.

## 수집 대상

- **지역**: 서울, 경기, 인천, 부산, 대구, 대전, 광주, 울산, 세종
- **키워드**: 클라이밍장, 볼더링, 클라이밍센터, 클라이밍짐

## 사전 준비

### 1. 네이버 개발자센터
1. https://developers.naver.com 에서 애플리케이션 등록
2. **검색 API** 사용 설정
3. Client ID / Client Secret 발급

### 2. GitHub Secrets 설정
리포지토리 Settings > Secrets and variables > Actions에서:
- `NAVER_CLIENT_ID`
- `NAVER_CLIENT_SECRET`

## 로컬 실행

```bash
pip install -r requirements.txt

export NAVER_CLIENT_ID="your_client_id"
export NAVER_CLIENT_SECRET="your_client_secret"

python -m src.main
```

## 데이터 파일

`data/climbing_gyms.csv`에 수집 결과가 저장됩니다.

| 이름 | 주소 | 전화번호 | 지역 | 최초 수집일 |
|------|------|----------|------|------------|
| 클라이밍파크 | 서울특별시 강남구 ... | 02-1234-5678 | 서울 | 2026-03-05 |

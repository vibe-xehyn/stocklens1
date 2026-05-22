# StockLens — 프로젝트 인계 파일
> 이 파일을 읽으면 프로젝트 전체 맥락을 파악할 수 있다. 새 세션 시작 시 "GEMINI.md 읽어" 하고 시작할 것.

---

## 프로젝트 개요
- **프로젝트명**: StockLens (주식 투자 신호 대시보드)
- **로컬 경로**: `/Users/mac/Desktop/vibecoding/stock-dashboard/`
- **GitHub**: `https://github.com/vibe-xehyn/stocklens1` (main 브랜치)
- **스택**: Node.js/Express ESM 백엔드 (`server.js`), 순수 HTML/CSS/JS SPA (`public/index.html`)

---

## 프로덕션 서버
- **주소**: Oracle Cloud Always Free VM `168.107.6.200`
- **OS**: Ubuntu, 1GB RAM + 2GB swap
- **배포 경로**: `/home/ubuntu/stocklens/`
- **PM2 프로세스명**: `stocklens` (NOT `stock-dashboard`)
- **포트**: 3000 (PORT env 변수). 포트 3001은 PORT 미설정 시 기본값 — 고아 프로세스 주의
- **SSH 키**: `~/Downloads/ssh-key-2026-05-20.key`

### 배포 명령
```bash
# 표준 배포
ssh -i ~/Downloads/ssh-key-2026-05-20.key ubuntu@168.107.6.200 \
  "cd ~/stocklens && git pull && pm2 restart stocklens"

# 스크리너 캐시 강제 초기화 후 배포
ssh -i ~/Downloads/ssh-key-2026-05-20.key ubuntu@168.107.6.200 \
  "rm -f ~/stocklens/.screener-cache.json && cd ~/stocklens && git pull && pm2 restart stocklens"

# 로그 확인
ssh -i ~/Downloads/ssh-key-2026-05-20.key ubuntu@168.107.6.200 \
  "pm2 logs stocklens --lines 30 --nostream"

# 서버에서 직접 API 테스트
ssh -i ~/Downloads/ssh-key-2026-05-20.key ubuntu@168.107.6.200 \
  "curl -s --max-time 10 'http://localhost:3000/api/screener-data' | python3 -c \"import json,sys; d=json.load(sys.stdin); print(len(d))\""
```

---

## 핵심 아키텍처

### 캐시 시스템
- `cached(key, ttl, fn)` — 인메모리 캐시 (`_c` Map, `getC`/`setC`)
- `.signal-cache.json` — 투자신호 디스크 캐시 (TTL 24h, 매일 00:00 KST 재계산)
- `.screener-cache.json` — 스크리너 디스크 캐시 (TTL 24h)
- `_signalStore` Map — 종목별 신호 저장소 (ticker → signal 객체)
- `ratesCache.usdkrw.value` — 실시간 USD/KRW 환율 (Stooq, 5분 캐시)

### 투자신호 함수
- `computeSignal(t, q, flow, macro)` — 순수 JS, AI 없음
- 8가지 팩터: technical(±40), value(±40), quality(±30), growth(±25), momentum(±25), flow, sentiment, macro
- 점수 임계값: ±60/30/10 → 강력매수/매수/약매수/중립/약매도/매도/강력매도
- **사이트 전체에서 동일 함수 사용** — `/api/signals`, `/api/analysis` 모두 동일 결과

### 유니버스
- KR: NAVER HTML 파싱 — 코스피(sosok=0) + 코스닥(sosok=1) 각 6페이지
- US: `SP500` 배열 상위 200개 — yfinance 주간 데이터 (`period='1y', interval='1wk'`)
- 신호 사전계산: 상위 1000개 (KR 300 + US 600)
- 신호 자동 재계산: 매일 00:00 KST (UTC 15:00)

### NAVER 스크리너 (`fetchNaverMarket`)
- URL: `https://finance.naver.com/sise/sise_market_sum.naver?sosok=0|1&pageNo=1~6`
- 헤더: `Cookie: field_list=12|00000012` (PER/PBR 컬럼 활성화)
  - 주의: `field_submit.naver`는 302 리다이렉트로 쿠키 손실 → 직접 쿠키 포함
- EUC-KR 디코딩: `new TextDecoder('euc-kr').decode(buf)`
- HTML이 EUC-KR 인코딩임에도 UTF-8 meta 태그를 달고 있어서 명시적 디코딩 필수
- 파싱: `numAll[-2]` = PER, `numAll[-1]` = PBR
  - 컬럼 순서: 가격 / 등락금액 / 등락% / 발행주식수 / PER / PBR
- PER 범위검증: `0 < per < 500`, PBR: `0 < pbr < 100`

### Python 연동
- `_pyExecLong(pyCode)` — yfinance 실행 (타임아웃 긴 버전)
- US yfinance는 try/catch로 감싸서 실패해도 KR 데이터는 저장됨

### 주요 API
| 엔드포인트 | 설명 |
|---|---|
| `GET /api/signals?market=all\|kr\|us` | 투자신호 목록. 각 신호 카테고리별 top 50 + 실제 전체 counts |
| `GET /api/screener-data` | 스크리너 (KR 340 + US 198 = 538개) |
| `GET /api/analysis?symbol=XXX&market=kr\|us` | 개별 종목 분석. `_signalStore` 우선 사용 |

---

## 프론트엔드 (`public/index.html`)
단일 대형 파일. 주요 구현:

### 투자신호 탭
- 매수/매도 모드 토글: `switchBuyMode('buy'|'sell')`
- 시장 탭: 전체 / 한국 / 미국
- 신호 탭: 전체 / 강력매수 / 매수 / 약매수
- 탭 카운트: `serverCounts[t]` 사용 (실제 전체 수, 50개 cap과 별개)
- 종목 리스트: flex 레이아웃 (grid 아님 — 모바일 이름 잘림 방지)

### 가격/시총 표시
- 미국 주식: 달러 + 원화 환산 병기 (`ratesCache.usdkrw.value`)
- 시가총액: `formatMarketCap()` — US는 달러 + 원화(조/억 단위)
- 환율 실시간 연동 (Stooq API)

### 모달 UI
- `#portfolioModal` — 포트폴리오 추가
- `#alertModal` — 알림 추가
- 기존 `prompt()`/`alert()`/`confirm()` 전면 교체
- ESC로 닫기, Enter로 확인

### 홈 섹션 순서
Hero → 지수 → 투자신호(최우선) → 상승/하락 → 한국주식 → 미국주식 → 매크로 → 포트폴리오

### 스크리너 카드
- 클라이언트 검증: `fmtSafe(v, decimals, min, max)` — 이상값 표시 방지
- 종목명 우선 표시 (코드번호 대신)

### UI 컨벤션 (절대 바꾸지 말 것)
- Hero 텍스트(StockLens 로고 + 설명 문구) **유지** — 제거 금지
- 홈 섹션 제목: "투자신호" (not "매수신호")
- 탭 버튼: "매수" / "매도" (not "매수 신호" / "매도 신호")
- KR 주식: 종목명 우선, 코드 보조
- US 주식: 영문명 + 티커

---

## 현재 알려진 이슈

1. **KR 소형주 종목명 코드번호 표시**
   - NAVER 6페이지(약 300개) 밖 소형주는 yfinance fallback
   - `fast_info.display_name` 실패 시 코드번호로 대체됨
   - 수정법: `info.get('shortName')` 사용 (단, 속도 저하 우려)

2. **스크리너 캐시 생성 시간**
   - 서버 재시작 후 약 2~3분 소요 (US yfinance 느림)
   - 그 사이 API 호출 시 응답 지연 또는 빈 응답

3. **고아 Node 프로세스**
   - PORT 환경변수 미설정 시 포트 3001에 프로세스 뜰 수 있음
   - `pm2 list`로 확인, 불필요한 프로세스는 `pm2 delete`로 정리

---

## 최근 커밋 히스토리 (주요)
```
e5aa8bd feat: UI/UX overhaul - modals, KRW conversion, signal tabs, mobile fixes
4daed43 Fix NAVER PER/PBR column index: numAll[-2]=PER, [-1]=PBR
dc8ac11 Fix NAVER screener: cookie-based URL instead of field_submit redirect
e7073bf fix: market tab counts show total regardless of selected market filter
```

---

## 로컬 개발 워크플로우
```bash
cd /Users/mac/Desktop/vibecoding/stock-dashboard

# 서버 실행 (로컬)
node server.js

# 수정 후 배포
git add public/index.html server.js
git commit -m "설명"
git push
ssh -i ~/Downloads/ssh-key-2026-05-20.key ubuntu@168.107.6.200 \
  "cd ~/stocklens && git pull && pm2 restart stocklens"
```

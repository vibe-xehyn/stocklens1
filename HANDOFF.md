# StockLens — Agent Handoff Document

> 작성일: 2026-05-26
> 이관 대상: Google Antigravity (또는 다른 AI 코딩 에이전트)
> 이관 주체: Claude Sonnet 4.6 (Anthropic)

---

## 1. 프로젝트 개요

### 목적
**StockLens** — 한국/미국 주식 종목의 실시간 퀀트 신호(강력매수~강력매도), 기술/펀더멘탈/수급/매크로 분석, AI 해설을 제공하는 웹 대시보드.

### 기술 스택
| 레이어 | 기술 |
|---|---|
| 백엔드 | Node.js (ESM), Express 4 |
| 프론트엔드 | Vanilla JS + HTML/CSS (SPA, 프레임워크 없음) |
| 데이터 수집 | Python (yfinance, pandas) — 영구 워커 프로세스 3개 |
| LLM (AI 해설) | Gemini 2.0 Flash (우선) → Groq llama-3.3-70b (폴백) |
| 배포 | Oracle Cloud Always Free VM (Ubuntu), pm2 |
| 소스 관리 | GitHub: `https://github.com/vibe-xehyn/stocklens1` (main 브랜치) |

### 디렉토리 구조
```
stock-dashboard/
├── server.js              # 메인 서버 (~4,213줄) — 모든 API, 시그널 계산, LLM 호출
├── yf_worker.py           # Python 영구 워커 (stdin/stdout JSON 프로토콜)
├── public/
│   └── index.html         # SPA 프론트엔드 (~3,106줄) — 모든 UI 포함
├── .env                   # 환경변수 (gitignore됨)
├── .screener-cache.json   # 스크리너 디스크 캐시
├── .signal-cache.json     # 시그널 디스크 캐시
├── .macro-cache.json      # 매크로 디스크 캐시
├── package.json           # Node 의존성
├── requirements.txt       # Python 의존성
└── GEMINI.md              # 프로젝트 컨텍스트 메모
```

---

## 2. 현재 작업 상태

### 완료된 작업 (최근 세션 기준)

1. **AI 분석 2단계 로딩 (Two-phase)**
   - Phase 1: `/api/analysis` → 결정론적 신호(즉시) — 신호 pill, 팩터 점수, price_move 바로 렌더
   - Phase 2: `/api/analysis/ai` → Gemini/Groq LLM 텍스트 — 로딩바와 함께 점진적 렌더
   - 프론트엔드: `renderAICardHeader()` + `renderAICardText()` 분리

2. **AI 프롬프트 품질 개선 (핵심)**
   - 이전 방식: 압축 코드 문자열(`RSI:80.9(과매수) | MACD:...`) → AI가 수치 선택적 무시
   - **현재 방식**: 수치를 완전한 팩트 문장으로 사전 구성 후 전달
     ```
     - RSI(14) 78.6 — 과매수 구간
     - MACD 10.039 vs 시그널 9.049 (골든크로스 — 상승 모멘텀)
     - ADX 37.0 — 강한 상승추세(+DI>-DI)
     ```
   - 결과: 모든 지표(RSI/MACD/ADX/BB/Stoch/W%R/OBV/CMF/MFI/이치모쿠/ROC/SAR/PER/PBR/ROE/FCF 등) 빠짐없이 인용 + 존댓말 줄글 해석

3. **효율화 개선**
   - `macroAll` → `macro` 캐시 통합 (Python 중복 호출 제거)
   - 사이드바 TTL 60s → 300s
   - 스크리너 캐시 우선 활용 (US 펀더멘탈)
   - precompute 캐시 키 정리 (`ai:` → `ai-text:`, `det:`, `rawdata:`)
   - 상위 100개 워밍업에서 AI 호출 제거 (비용 절감)

4. **동종업계 비교(peers) 완전 재작성**
   - 50+ 업종 매핑(`PEER_MAP`) + 한국 주요 25종목 하드코딩(`KR_PEER_MAP`)
   - `yf.download` 단일 티커 구조 버그 수정
   - `safe_float()` NaN/Inf 처리
   - 3단계 피어 탐색: 업종 정확 → 섹터 부분 → 키워드 매칭

5. **`UNDEFINED` 심볼 500 에러 수정**
   - 원인: `/api/chart?symbol=UNDEFINED` → Python 워커에 전달 → 404 → 서버 500
   - 수정: chart 엔드포인트 서버사이드 가드 + 프론트엔드 `selectStock` toLowerCase() 가드

6. **`normalizeMacro()` 추가**
   - `fetchMacroData` (`{value, change}`) ↔ `computeSignal` (`{value, chg}`) 포맷 불일치 해결

### 현재 진행 중이던 작업
**없음.** 마지막 작업(UNDEFINED 500 에러 수정)이 배포까지 완료된 상태.
VM에 최신 코드 반영됨 (commit `80f745f`).

### 남은 작업 (미완료)
명시적으로 지정된 미완료 태스크는 없으나, 잠재적 개선 영역:

- [ ] Gemini API 키가 모두 429(한도 초과)일 때 Groq도 실패하면 `/api/analysis/ai`가 500 반환 가능 → `det:${symbol}` 캐시가 없을 경우 폴백 없음 (실제로는 `det:` 캐시가 있어 대부분 안전)
- [ ] `SQ` 종목이 Yahoo Finance에서 상장폐지 처리됨 (`SQ` → `XYZ` 또는 `BLOCK`) — 스크리너에서 제거 필요
- [ ] AI 텍스트 토큰 소비 모니터링 체계 없음

---

## 3. 핵심 파일 & 코드 컨텍스트

### server.js 주요 구조 (라인 기준)

| 라인 | 내용 |
|---|---|
| 1–153 | `buildDeterministicAnalysis()` — 결정론적 분석 텍스트 생성 (numbers guaranteed) |
| 155–196 | Express 설정, 캐시(`_c` Map), `serveSWR` |
| 1482–2627 | `computeSignal(t, q, flow, macro)` — 5팩터 점수 계산 (pure function) |
| 2628–2667 | `geminiChat()`, `groqChat()` — LLM 호출 함수 |
| 2668–2758 | `buildAIPrompt()` — **최근 핵심 수정** (팩트 문장 사전 구성 방식) |
| 2779–2848 | `GET /api/analysis` — Phase 1 결정론적 분석 |
| 2849–2907 | `GET /api/analysis/ai` — Phase 2 LLM 분석 |
| 3027–3560 | `GET /api/peers` — 동종업계 비교 |
| 3598–3615 | `normalizeMacro()` |
| 3737–3818 | `fetchTopByMarketCap(1000)` — 상위 1000종목 (KR 300 + US 600+) |
| 3960–4027 | `precomputeAllSignals()` — 일 2회(06:00/18:00 KST) 전체 시그널 계산 |
| 4028–4070 | `precomputeTopAnalysis(100)` — 상위 100종목 상세 데이터 워밍업 (AI 제외) |
| 4118+ | 서버 시작, 초기화, 스케줄러 |

### 최근 수정 파일 요약

**server.js (commit a87eddd → 80f745f)**
- `buildAIPrompt()`: 압축 코드 → 완전한 팩트 문장 구조로 전면 재작성
  - `techFacts`, `fundFacts`, `flowFacts`, `macroFacts` 배열로 각 지표를 `"RSI(14) 78.6 — 과매수 구간"` 형태로 사전 구성
  - AI 지시문: "아래 [팩트 데이터]의 수치를 각 섹션에서 빠짐없이 인용하고 의미 해석"
- `/api/chart` 가드: `UNDEFINED/undefined/null` 심볼 즉시 400 반환

**public/index.html (commit 80f745f)**
- `selectStock()` 가드: `id === 'undefined'` → `id.toLowerCase() === 'undefined'` (대소문자 무관 차단)

### 중요 설계 결정

| 결정 | 이유 |
|---|---|
| Python 영구 워커 프로세스 | `yfinance` import 700ms 절감. 요청마다 Python 실행 불가 |
| `buildDeterministicAnalysis()` 별도 유지 | LLM 실패 시 항상 숫자 기반 폴백 텍스트 보장 |
| AI 프롬프트에 팩트 문장 사전 구성 | LLM은 압축 코드(`RSI:80.9`)를 선택적으로 무시하지만, 완전한 문장으로 주면 반드시 포함 |
| Gemini 우선 → Groq 폴백 | Gemini Flash가 빠르고 저렴. Groq는 API 키 단수라 rate limit 위험 |
| `rawdata:${symbol}` 캐시 | `/api/analysis`가 먼저 실행되어 `rawdata:`를 세팅 → `/api/analysis/ai`가 재사용 |
| precompute에서 AI 제거 | 100종목 × LLM = 막대한 토큰 소비. AI는 사용자 요청 시에만 |

---

## 4. 환경 설정

### 필요한 환경변수 (`.env` 파일)
```
PORT=                    # 서버 포트 (VM에서는 3000, 로컬 기본 3001)
GEMINI_API_KEY=          # Gemini API 키 (복수 가능, 쉼표 구분: key1,key2,key3)
GROQ_API_KEY=            # Groq API 키 (단수)
```

### 실행 명령어
```bash
# 의존성 설치
npm install
pip install -r requirements.txt   # Python 워커용

# 로컬 실행
npm start          # node server.js (포트 3001)
npm run dev        # node --watch server.js (파일 변경 감지)

# 프로덕션 (VM)
pm2 restart stocklens
```

### 배포 정보
- **VM**: Oracle Cloud Always Free (1GB RAM + 2GB swap)
- **주소**: `168.107.6.200`
- **SSH**: `ssh -i ~/Downloads/ssh-key-2026-05-20.key ubuntu@168.107.6.200`
- **앱 경로**: `/home/ubuntu/stocklens`
- **배포 명령**:
  ```bash
  ssh -i ~/Downloads/ssh-key-2026-05-20.key ubuntu@168.107.6.200 \
    "cd /home/ubuntu/stocklens && git pull && pm2 restart stocklens"
  ```

### 의존성 특이사항
- `yahoo-finance2` (npm): 보조적으로 사용. 주 데이터는 Python `yfinance`
- `yfinance>=0.2.40`: Yahoo v8 API 사용. `curl_cffi` 없으면 일부 데이터 실패
- `@anthropic-ai/sdk`, `openai`: package.json에 있으나 현재 LLM 호출은 raw `fetch`로 직접 구현 (미사용)
- Node.js ESM 모드 (`"type": "module"` in package.json) — `require()` 사용 불가, `import` 필수

---

## 5. 현재 문제 / 미해결 이슈

### [해결됨] UNDEFINED 심볼 HTTP 500
- **증상**: 특정 상황에서 "데이터 로딩 실패: HTTP 500" 메시지 표시
- **원인**: peers/screener 렌더링 시 `d.ticker`가 undefined인 항목의 onclick → `selectStock('undefined')` → `/api/chart?symbol=UNDEFINED` → Python 워커 404 → Express 500
- **수정**: chart 엔드포인트 서버사이드 가드 + `selectStock` toLowerCase() 가드 (commit `80f745f`)

### [미해결] Gemini 키 한도 초과 시 Groq도 실패 가능
- **증상**: 로그에 `Gemini 실패, Groq 시도: Gemini 모든 키 한도 초과` 반복 출력
- **상황**: Gemini 모든 키 429 → Groq 시도 → Groq도 rate limit이거나 키 없으면 → 500 반환
- **현재 보호**: `det:${symbol}` 캐시가 있으면 폴백으로 결정론적 텍스트 반환
- **완전한 해결 방안**: `/api/analysis/ai`의 catch 블록에서 `det:${symbol}` 없어도 `buildDeterministicAnalysis()` 직접 호출하여 반환

### [미해결] SQ 종목 상장폐지
- `['SQ']` Yahoo Finance에서 데이터 없음 오류 반복 → 에러 로그 오염
- `SQ`는 `BLOCK`으로 티커 변경됨. 스크리너/사전 계산 유니버스에서 제거 또는 매핑 필요

### [주의] 캐시 파일 삭제 시 재계산
- `.signal-cache.json` 삭제 → 서버 시작 시 1000종목 전체 시그널 재계산 (~8분 소요)
- `.screener-cache.json` 삭제 → 스크리너 데이터 재수집 (~5분)
- 의도적 갱신 시에만 삭제할 것

---

## 6. 다음 AI에게 전달할 즉시 실행 지시

### 현재 상태 확인 (첫 번째로 할 일)

```bash
# 1. VM 서버 상태 확인
ssh -i ~/Downloads/ssh-key-2026-05-20.key ubuntu@168.107.6.200 "pm2 status"

# 2. 최신 코드 확인
cd /Users/mac/Desktop/vibecoding/stock-dashboard
git log --oneline -5

# 3. 로컬에서 동작 확인
npm start
curl "http://localhost:3001/api/analysis?symbol=AAPL&market=us" | head -c 200
```

### 우선순위별 즉시 실행 태스크

**[P1] `/api/analysis/ai` 완전한 폴백 보장**
현재 Gemini+Groq 모두 실패 시, `det:${symbol}` 캐시가 없으면 500 반환.
`server.js` 2900~2907라인의 catch 블록을 수정:
```javascript
} catch (e) {
  console.error('AI 분석 실패:', symbol, e.message?.slice(0, 120));
  const det = getC(`det:${symbol}`);
  if (det) return res.json({ ...det, _fallback: true });
  // det 캐시도 없으면 rawdata로 직접 결정론적 생성
  try {
    const fallback = buildDeterministicAnalysis(symbol, isKr, t, q, news, flow, macro, sig);
    return res.json({ ...fallback, _fallback: true });
  } catch {
    res.status(500).json({ error: e.message });
  }
}
```

**[P2] `SQ` 종목 제거/수정**
`server.js`에서 STOCK_DEFS 또는 스크리너 유니버스에서 `SQ` → `XYZ` (Block Inc.)로 교체하거나 제거.

**[P3] AI 응답 품질 지속 모니터링**
실제 사용 중 AI 답변이 수치 누락하거나 한국어 존댓말을 어기면, `buildAIPrompt()` (server.js:2668) 수정.
현재 프롬프트 구조: 팩트 문장 배열 → JSON 섹션별 필드 요구사항.

### 핵심 아키텍처 요약 (즉시 이해용)

```
사용자 클릭 selectStock(id)
    ↓
[병렬 API 호출]
  /api/quote   → 현재가, 재무비율
  /api/chart   → 차트 데이터
  /api/analysis → Phase 1: 결정론적 신호 (즉시)
                  └─ computeSignal(tech, quote, flow, macro) → signal/score/breakdown/reasons
                  └─ buildDeterministicAnalysis() → 팩트 텍스트
                  └─ rawdata:{symbol} 캐시에 원시 데이터 저장
  /api/news    → 뉴스
  /api/flow    → 수급
  /api/earnings → 실적
  /api/peers   → 동종업계

[Phase 1 완료 후]
  renderAICardHeader() → 신호 pill + 팩터 점수 즉시 표시

[Phase 2 비동기]
  /api/analysis/ai → buildAIPrompt() → geminiChat() → groqChat() 폴백
                   → JSON 파싱 → renderAICardText() → 로딩바 완료 + 텍스트 표시

[백그라운드 스케줄]
  06:00 KST, 18:00 KST → precomputeAllSignals(1000종목) → precomputeTopAnalysis(100종목, AI 제외)
```

---

## 7. 참고 — 최근 커밋 히스토리

```
80f745f fix: block UNDEFINED symbol on chart endpoint and frontend guard
a87eddd improve AI prompt: pre-build factual sentences to guarantee all indicators cited
af5f4dd precompute: remove AI warmup, only cache det/quote/flow/news/earn/peers/chart
95cd483 rewrite AI prompt: formal Korean, cite all values, detailed prose
30045d8 efficiency: merge macroAll→macro cache, sidebar TTL 300s, screener-first fundaments
d4889eb fix peers: comprehensive peer_map, robust single-ticker download, KR fallback
9a22170 improve AI prompt: prose explanation over number listing
074b8a8 fix: guard selectStock against undefined/null id
```

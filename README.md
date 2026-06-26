# @magiof/saju-calendar

Magiof 사주·만세력 엔진. 생년월일시 하나로 원국, 십성, 12운성, 합충형파해, 신살, 신강·격국·용신, 대운·세운·월운, 공망까지 구조화된 JSON과 LLM용 압축 텍스트를 반환합니다.

```
npm install @magiof/saju-calendar
```

- gzip **~16KB** · 런타임 의존성 **0개** · Node **≥18**

## 빠른 시작

```ts
import { calculateSaju } from "@magiof/saju-calendar";

const result = calculateSaju({
  year: 1993,
  month: 8,
  day: 4,
  hour: 19,
  minute: 10,
  gender: "남",
  calendar: "solar",
  applyLocalMeanTime: true,
  longitude: 126.978,
});

// 구조화된 만세력 데이터
result.pillars;          // { year, month, day, hour }
result.advanced.geukguk; // 격국
result.daeun.list;       // 대운 목록

// AI·로그용 압축 텍스트
result.toCompact();
```

## API

| | 설명 |
|:--|:--|
| `calculateSaju(input)` | 만세력 전체 계산. `SajuResult` 반환 |
| `result.toCompact()` | 만세력·LLM용 압축 텍스트 (문자열) |
| `lunarToSolar(y, m, d, leap?)` | 음력 → 양력 |
| `solarToLunar(y, m, d)` | 양력 → 음력 |

`toCompact`는 `calculateSaju` 결과에 붙는 메서드입니다. 별도 export 함수가 아닙니다.

### 입력 (`SajuInput`)

```ts
calculateSaju({
  year: 1993,              // 필수
  month: 8,                // 필수
  day: 4,                  // 필수
  hour: 19,                // 기본 12
  minute: 10,              // 기본 0
  gender: "남",            // "남" | "여"
  calendar: "solar",       // "solar" | "lunar"
  leap: false,             // 음력 윤달
  timezone: "Asia/Seoul",
  longitude: 126.978,      // applyLocalMeanTime=true 일 때
  applyLocalMeanTime: false,
  now: new Date(),         // 세운·월운·만세력 기준 시각 (테스트·재현용)
});
```

### 출력 (`SajuResult`) 주요 필드

| 필드 | 내용 |
|:--|:--|
| `pillars` / `pillarDetails` | 사주 4주 (천간·지지·오행·음양·지장간) |
| `tenGods` | 천간·지지 십성 |
| `stages12` | 봉법·거법 12운성 |
| `stemRelations` / `branchRelations` | 천간 합·충, 지지 합·충·형·파·해 등 |
| `sals` | 주별 12신살, 특수신살, `sinsalTiers` (core / secondary / hidden) |
| `fiveElements` / `gongmang` | 오행 분포, 공망 |
| `daeun` / `seyun` / `wolun` | 대운·세운·월운 |
| `advanced.dayStrength` | 신강·신약 (strong / weak / neutral + score) |
| `advanced.dayStrengthDetail` | 4득·통근·설기·극제·부력·종격 후보 |
| `advanced.geukguk` | 격국 |
| `advanced.yongsin` / `yongsinDetail` | 용신, 조후·억부 상세 |
| `advanced.sinsal` | `{ names: string[] }` — 길신/흉신 구분 없음 |
| `advanced.sinsalDetail` | `{ core, secondary }` — 중요도 티어 |
| `reference` | 올해·이번달·오늘 간지 코드 |
| `toCompact()` | 아래 포맷의 압축 문자열 |

## `toCompact()` 포맷

해석 라벨(강약·격·용신)과 일간 지표를 포함합니다. UI 렌더링용이 아니라 **AI 프롬프트·로그·스냅샷** 용도입니다.

포함: `## 기본` · `## 원국` · `## 오행` · `## 관계` · `## 대운` · `## 세운` · `## 월운` · `## 만세력`

신살은 **길신/흉신으로 나누지 않습니다.** 이름 목록 + `신살중요도 core / secondary`만 출력합니다.

```
## 기본
1993.08.04 19:10 남 양력 Asia/Seoul 만 33세
일간 丁(정)화- 강약: 중(59) 격: 식상격 용신: 癸, 庚, 甲 조후 수(壬,癸) 억부 수(壬,癸)
LMT 1993-08-04 19:10 (경도 126.978° +0.0분)
일간지표 득령X 득지O 득세X 득시O 통근2 설기3 극제1 부력2 종격없음

## 원국
  시 | 일 | 월 | 연
干 己(기)토- | 丁(정)화- | 己(기)토- | 癸(계)수-
支 酉(유)금- | 巳(사)화+ | 未(미)토- | 酉(유)금-
장간 -,-,辛 | 戊,庚,丙 | 丁,乙,己 | -,-,辛
…

## 오행
干: 목0 화1 토2 금1 수0 | 支: … | 계: …
공망 寅(인) 卯(묘)
신살 천을귀인, 홍염살, …
신살중요도 core 천을귀인 | secondary 홍염살

## 관계
干충: 丁癸 | 반합: 巳酉 | …

## 대운 순행 시작 …
…
```

전체 샘플은 `npm run sample`로 확인할 수 있습니다.

## 아키텍처

```
calculateSaju()
  ├─ manse.ts    달력 변환, LMT, 4주, 절기
  ├─ analyze.ts  십성, 합충, 대운, 신강, 용신, 신살
  └─ format.ts   toCompact() 텍스트 생성
```

- `calculateSaju` — 계산 엔진. 구조화된 `SajuResult` 반환
- `toCompact` — 같은 결과의 텍스트 요약. 추가 계산 없음

## 개발

```bash
npm install
npm test          # 단위 테스트
npm run typecheck
npm run build     # dist/index.mjs + dist/index.d.ts
npm run sample    # toCompact 샘플 출력
npm run perf      # 벤치마크
```

## 배포

```bash
npm run build
npm test
npm publish --access public
```

scoped 패키지(`@magiof/...`)는 첫 배포 시 `--access public`이 필요합니다.

## 라이선스

MIT

초기 만세력·절기 골격은 [golbin/ssaju](https://github.com/golbin/ssaju) (MIT) v0.2.0에서 출발했으나, 이후 Magiof에서 신강·용신·신살 티어링·출력 포맷 등을 전면 개편했습니다.

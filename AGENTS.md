# AGENTS.md

AI 에이전트 및 개발자가 이 저장소에서 작업할 때 반드시 준수해야 할 규칙과 가이드라인을 정의합니다.

---

## 프로젝트 개요

순수 HTML5 / Vanilla JS / CSS3 기반의 소규모 웹 게임 프로토타입을 통합 관리하는 모노레포입니다.
각 게임은 독립된 하위 프로젝트로 존재하며, 공용 리소스는 `common/` 디렉토리를 통해 공유합니다.

---

## 디렉토리 구조 규칙

```
AI/
├── common/                   # 공통 리소스 (모든 하위 프로젝트 공유 가능)
│   ├── common.css            # 공통 스타일
│   ├── common.js             # 공통 유틸리티
│   ├── threejs/              # three.js 라이브러리
│   └── {library-name}/       # 기타 외부 라이브러리
│
├── monster-breakout-hero/    # 하위 프로젝트 예시
│   ├── AGENTS.md
│   ├── README.md
│   ├── index.html            # 프로젝트 실행 파일
│   ├── css/                  # 프로젝트 전용 스타일시트 디렉토리
│   │   └── style.css         # 프로젝트 전용 메인 스타일시트 파일
│   └── js/                   # 프로젝트 전용 스크립트 디렉토리
│       └── game.js           # 프로젝트 전용 메인 스크립트 파일
│
└── {프로젝트명}/             # 추가 하위 프로젝트
    ├── AGENTS.md
    ├── README.md
    ├── index.html            # 프로젝트 실행 파일
    ├── css/                  # 프로젝트 전용 스타일시트 디렉토리
    │   └── style.css         # 프로젝트 전용 메인 스타일시트 파일
    └── js/                   # 프로젝트 전용 스크립트 디렉토리
        └── game.js           # 프로젝트 전용 메인 스크립트 파일
```

### 규칙 요약

| 항목 | 규칙 |
|------|------|
| 하위 프로젝트 루트 | 루트 기준 **1단계 디렉토리** (예: `monster-breakout-hero/`) |
| 외부 라이브러리 위치 | `common/{라이브러리명}/` (1단계 `common` → 2단계 라이브러리명) |
| 공통 리소스 위치 | `common/` 디렉토리 |
| 프로젝트 간 의존성 | **금지** — 각 프로젝트는 독립적으로 동작해야 함 |
| 프로젝트 간 파일 참조 | **금지** — 다른 하위 프로젝트의 파일을 직접 참조하지 않음 |

---

## 기술 스택 규칙

### 허용
- **HTML5** — 시맨틱 마크업, Canvas, Web Audio API 등 네이티브 API 적극 활용
- **Vanilla JS (ES6+)** — 빌드 도구 없이 브라우저에서 직접 실행 가능한 코드
- **CSS3** — Custom Properties, Flexbox, Grid, Animation, Transition 등 활용
- **외부 라이브러리** — `common/{라이브러리명}/`에 로컬 파일로 배치 후 상대 경로로 참조

### 금지
- **프레임워크** — React, Vue, Angular, Svelte 등 JS 프레임워크 사용 금지
- **빌드 도구** — Webpack, Vite, Rollup 등 번들러 사용 금지
- **패키지 매니저 의존** — `node_modules` 생성 금지. 라이브러리는 정적 파일로 직접 포함
- **TypeScript** — `.ts` 파일 사용 금지 (순수 `.js`만 허용)
- **서버사이드 코드** — Node.js, Python 등 백엔드 코드 금지 (정적 파일만)

---

## 하위 프로젝트 생성 규칙

새 하위 프로젝트를 생성할 때 아래 기준을 따릅니다.

### 1. 디렉토리 명명 규칙
- 소문자 영문 + 하이픈(`-`) 조합 사용
- 게임의 특성이 명확히 드러나는 이름 사용
- 예: `monster-breakout-hero`, `space-shooter`, `tile-puzzle`

### 2. 필수 파일
각 하위 프로젝트는 최소한 아래 파일을 포함해야 합니다.

```
{프로젝트명}/
├── index.html     # 진입점. <title>은 게임 이름으로 설정
├── css            # 프로젝트 전용 스타일시트 디렉토리
│   └── style.css  # 프로젝트 전용 메인 스타일시트 파일
└── js             # 프로젝트 전용 스크립트 디렉토리
    └── game.js    # 프로젝트 전용 메인 스크립트 파일
```

### 3. 외부 라이브러리 참조 방법
CDN 대신 **로컬 파일** 참조를 원칙으로 합니다.

```html
<!-- 올바른 예: 로컬 common 경로 참조 -->
<script src="../common/threejs/three.min.js"></script>

<!-- 잘못된 예: CDN 직접 참조 (프로토타입 단계에서는 허용하나 지양) -->
<script src="https://cdn.jsdelivr.net/npm/three@0.x.x/..."></script>
```

### 4. 공통 리소스 참조
`common/`의 공통 CSS, JS를 사용할 경우 상대 경로로 참조합니다.

```html
<link rel="stylesheet" href="../common/common.css">
<script src="../common/common.js"></script>
```

---

## 외부 라이브러리 추가 규칙

1. `common/{라이브러리명}/` 디렉토리를 생성합니다.
2. 라이브러리의 **정적 파일(minified JS, CSS 등)** 을 해당 디렉토리에 배치합니다.
3. `common/` 루트의 `README.md` 또는 별도 `LIBRARIES.md`에 버전과 출처를 기록합니다.
4. 라이선스 파일(`LICENSE`)이 있다면 함께 포함합니다.
5. 현재 존재하지 않는 외부 라이브러리 설치가 필요한 경우 **사용자에게 `외부 라이브러리` 설치가 필요함을 공지** 한다.

```
common/
└── threejs/
    ├── three.min.js      # 라이브러리 본체
    ├── LICENSE           # 라이선스
    └── README.md         # 버전 및 출처 기록
```

---

## 코드 작성 규칙

### HTML
- `<!DOCTYPE html>` 및 `lang` 속성 필수
- 의미론적 태그 우선 사용 (`<main>`, `<section>`, `<article>` 등)
- `<meta charset="UTF-8">` 및 `<meta name="viewport" ...>` 필수

### CSS
- CSS Custom Properties(변수) 적극 활용 (`--primary-color` 등)
- 전역 스타일 오염 방지: 클래스 이름에 프로젝트명 prefix 사용 권장
  - 예: `.mbh-container` (monster-breakout-hero), `.ss-hud` (space-shooter)
- `common.css`에 정의된 변수 및 유틸리티 클래스 재정의 금지

### JavaScript
- ES6+ 문법 사용 (`const`, `let`, 화살표 함수, 클래스, 모듈 패턴 등)
- 전역 변수 최소화: IIFE 또는 ES Module (`type="module"`) 활용
- 게임 루프는 `requestAnimationFrame` 기반으로 구현
- 하드코딩된 매직 넘버는 상수(`const CONFIG = {...}`)로 분리

---

## 작업 범위 규칙 (에이전트 준수 사항)

- **작업 범위**: 지시된 하위 프로젝트 디렉토리 내에서만 파일을 생성/수정한다.
- **타 프로젝트 불간섭**: 다른 하위 프로젝트의 파일을 임의로 수정하지 않는다.
- **common 수정 시 협의**: `common/` 디렉토리 변경 시 모든 프로젝트에 영향을 줄 수 있으므로, 반드시 사용자와 협의 후 진행한다.
- **삭제 금지**: 기존 파일 삭제 전 반드시 사용자에게 확인한다.
- **index.html 독립 실행**: 각 프로젝트의 `index.html`은 브라우저에서 파일을 직접 열어도 동작해야 한다 (로컬 서버 불필요).

---

## 하위 프로젝트 목록

| 디렉토리 | 게임명 | 설명 | 상태 |
|----------|--------|------|------|
| `monster-breakout-hero/` | 몬스터 벽돌깨기 히어로 | 몬스터를 벽돌로 삼아 격파하는 벽돌깨기 게임 | 🚧 개발 중 |
| `matter-breakout/` | 벽돌깨기 (Matter.js) | Matter.js 물리 엔진을 활용한 벽돌깨기 게임 | 🚧 개발 중 |

> 새 프로젝트 추가 시 이 표를 업데이트합니다.
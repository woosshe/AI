# AI — 웹 게임 프로토타입 통합 프로젝트

순수 HTML5 / Vanilla JS / CSS3 만으로 제작된 소규모 웹 게임 프로토타입 모음입니다.
빌드 도구 없이 브라우저에서 바로 실행할 수 있는 경량 게임들을 개발하고 통합 관리합니다.

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 마크업 | HTML5 (Canvas, Web Audio API 등 네이티브 API 포함) |
| 스타일 | CSS3 (Custom Properties, Grid, Flexbox, Animation) |
| 스크립트 | Vanilla JS (ES6+, 프레임워크·빌드 도구 미사용) |
| 외부 라이브러리 | 필요 시 `common/` 디렉토리에 로컬 배치하여 사용 |

---

## 프로젝트 구조

```
AI/
├── common/                   # 공통 리소스 & 외부 라이브러리
│   ├── common.css            # 공통 CSS 변수 및 유틸리티
│   ├── common.js             # 공통 JS 유틸리티
│   └── threejs/              # three.js (필요 시 추가)
│
├── monster-breakout-hero/    # 몬스터 벽돌깨기 히어로
│   ├── AGENTS.md
│   ├── README.md
│   ├── index.html            # 프로젝트 실행 파일
│   ├── css/                  # 프로젝트 전용 스타일시트 디렉토리
│   │   └── style.css         # 프로젝트 전용 메인 스타일시트 파일
│   └── js/                   # 프로젝트 전용 스크립트 디렉토리
│       └── game.js           # 프로젝트 전용 메인 스크립트 파일
│
├── AGENTS.md                 # AI 에이전트 작업 규칙
└── README.md                 # 이 파일
```

---

## 게임 목록

### 🎮 몬스터 벽돌깨기 히어로 (`monster-breakout-hero/`)

> 몬스터들이 벽돌 블록이 되어 늘어선 필드를 공으로 격파하는 벽돌깨기 게임 프로토타입

- **장르**: 아케이드 / 벽돌깨기
- **상태**: 🚧 개발 중
- **실행**: `monster-breakout-hero/index.html` 을 브라우저로 열기

### 🕹️ 벽돌깨기 - Matter.js (`matter-breakout/`)

> Matter.js 물리 엔진을 도입하여 사실적인 충돌과 물리 작용을 구현한 벽돌깨기 게임

- **장르**: 아케이드 / 물리 퍼즐
- **상태**: 🚧 개발 중
- **실행**: `matter-breakout/index.html` 을 브라우저로 열기

---

## 실행 방법

별도의 빌드 과정이 없습니다. 원하는 게임의 `index.html` 파일을 브라우저로 직접 열면 됩니다.

```bash
# 예시: 로컬 정적 서버를 사용할 경우 (선택 사항)
cd monster-breakout-hero
python -m http.server 8080
# 브라우저에서 http://localhost:8080 접속
```

또는 `monster-breakout-hero/index.html` 파일을 브라우저로 드래그 앤 드롭하거나 더블클릭으로 실행합니다.

---

## 공통 리소스 (`common/`)

모든 하위 프로젝트에서 공유할 수 있는 리소스를 관리하는 디렉토리입니다.

| 파일/폴더 | 역할 |
|-----------|------|
| `common.css` | 공통 CSS 변수 (색상 팔레트, 폰트, 간격 등), 리셋 스타일 |
| `common.js` | 공통 유틸리티 함수 (수학, 충돌 감지, 입력 처리 등) |
| `threejs/` | three.js 라이브러리 정적 파일 |
| `{라이브러리명}/` | 추가 외부 라이브러리 (tailwindcss, howler.js 등) |

하위 프로젝트에서 공통 리소스를 참조할 때는 상대 경로를 사용합니다.

```html
<link rel="stylesheet" href="../common/common.css">
<script src="../common/common.js"></script>
```

---

## 새 게임 프로젝트 추가하기

1. 루트에 새 디렉토리를 생성합니다. (소문자 + 하이픈 명명 규칙)
   ```
   my-new-game/
   ├── index.html
   ├── css            # 프로젝트 전용 스타일시트 디렉토리
   │   └── style.css  # 프로젝트 전용 메인 스타일시트 파일
   └── js             # 프로젝트 전용 스크립트 디렉토리
       └── game.js    # 프로젝트 전용 메인 스크립트 파일
   ```

2. `index.html`에 기본 구조를 작성합니다.
   ```html
   <!DOCTYPE html>
   <html lang="ko">
   <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>내 새 게임</title>
     <link rel="stylesheet" href="../common/common.css">
     <link rel="stylesheet" href="./css/style.css">
   </head>
   <body>
     <!-- 게임 캔버스 또는 UI -->
     <script src="../common/common.js"></script>
     <script src="./js/game.js"></script>
   </body>
   </html>
   ```

3. 이 `README.md`의 **게임 목록** 섹션과 `AGENTS.md`의 **하위 프로젝트 목록** 표를 업데이트합니다.

---

## 개발 규칙 요약

- 각 프로젝트는 **완전히 독립적**으로 동작해야 하며, 다른 하위 프로젝트 파일을 참조하지 않습니다.
- 외부 라이브러리는 CDN이 아닌 **로컬 파일**로 `common/`에 배치합니다.
- 빌드 도구, 프레임워크, TypeScript는 사용하지 않습니다.
- 자세한 규칙은 [AGENTS.md](./AGENTS.md)를 참조하세요.

---

## 라이선스

각 외부 라이브러리의 라이선스는 해당 `common/{라이브러리명}/` 디렉토리 내 `LICENSE` 파일을 참조하세요.
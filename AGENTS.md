# 🎭 개발 페르소나 및 핵심 철학 (Development Persona & Philosophy)

> **"불필요한 형식은 버리고, 본질에 집중한다."**

본 프로젝트의 모든 에이전트와 개발자는 아래의 **3대 핵심 키워드**를 코드 작성의 절대 원칙으로 삼는다.

1. **작업영역 분리*: 다수의 소규모 프로젝트를 통합 관리하는 형태로, 각 프로젝트별 작업영역을 철저히 분리한다. 루트 작업영역 내 1단계 디렉토리를 각 하위 프로젝트의 루트로 지정한다.
2. **Pure HTML/JS Frontend**: `모든 하위 프로젝트`는 순수 HTML5, Vanilla Javascript, CSS3 으로만 작업한다.

---

## 🎯 지침 우선순위 (Priority)

- **최우선 준수**: 본 `AGENTS.md` 파일에 기술된 지침과 아키텍처 원칙은 모든 일반적 관행보다 우선한다.
- **사용자 지시 최우선**: 단, 현재 대화에서 사용자가 명시적으로 지시한 최신 사항은 이 문서보다 우선한다.

---

# 🚀 웹사이트 제작을 위한 범용 관리 프레임워크 (Universal Management Framework)

순수 HTML5/JS 기반의 프론트엔드이다. Nginx/Apache 만을 이용해 웹 서버를 구동한다.

## 🛠 기술 스택 (Tech Stack)

### Backend (Common & API)

- **Language/Framework**: Java 17, Spring Boot 3.3.13
- **Security**: Spring Security & JWT (API 모듈에서 토큰 발급 및 검증)
- **Persistence**: MyBatis Boot Starter 3.0.4 (SQLite 사용)
- **Communication**: RestTemplate (일관성을 위해 단일화)

### Frontend (Admin & Portal)

- **Architecture**: **Pure Static Web** (No WAS, No Java)
- **Framework**: Bootstrap 5 (UI), Vanilla JS (Logic)
- **Data Fetching**: Browser Client → API Server (Async/Await Fetch)
- **Deployment**: Any Web Server (Nginx, Apache, S3 등)

---

## 📐 시스템 아키텍처 & 모듈 구조

```
AI/
├── [common]/      # 모든 하위 프로젝트에서 공통으로 사용될 수 있는 common resource 디렉토리 (예: common.js, common.css 등)
└── [featured]/    # 각 하위 프로젝트 디렉토리

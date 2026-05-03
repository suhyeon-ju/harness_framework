# Harness Framework

Claude Code를 이용한 대규모 개발 작업을 **단계적으로 자동 실행**하기 위한 메타 프레임워크.
프로젝트를 Phase → Step으로 분해하고, AI 에이전트가 각 Step을 순차 실행하며 자가 교정한다.

---

## 개요

일반적인 AI 코딩 도구는 대화 세션 단위로 작동한다. 세션이 끊기면 맥락이 사라지고,
복잡한 다단계 작업은 중간에 방향을 잃기 쉽다. Harness Framework는 이 문제를 해결한다.

- 작업을 JSON 파일로 명세화 → Claude가 세션마다 동일한 맥락을 받아 작업
- 완료된 Step의 산출물을 누적해 다음 Step 프롬프트에 자동 주입
- 실패 시 에러 메시지를 피드백해 최대 3회 자가 교정
- 진행 상태를 JSON 상태 머신으로 관리해 언제든 중단·재개 가능

---

## 디렉토리 구조

```
harness_framework/
├── .claude/
│   ├── commands/
│   │   ├── harness.md          # /harness 커맨드 — Phase/Step 설계 워크플로우
│   │   └── review.md           # /review 커맨드 — 변경사항 아키텍처 검증
│   ├── settings.json           # 안전 훅 + 세션 종료 시 자동 테스트
│   └── settings.local.json     # 로컬 전용 권한 설정
├── docs/
│   ├── ARCHITECTURE.md         # 프레임워크 아키텍처 (이 파일)
│   ├── ADR.md                  # Architecture Decision Records 템플릿
│   ├── PRD.md                  # Product Requirements Document 템플릿
│   └── UI_GUIDE.md             # UI 디자인 가이드라인
├── scripts/
│   ├── execute.py              # Step 실행 엔진 (StepExecutor 클래스)
│   └── test_execute.py         # execute.py 테스트 suite (pytest)
├── phases/                     # (사용 시 생성) Phase/Step 파일 저장소
│   ├── index.json              # 전체 Phase 현황
│   └── {phase-name}/
│       ├── index.json          # Phase 내 Step 목록 및 상태
│       ├── step0.md            # Step 0 지시서
│       ├── step1.md            # Step 1 지시서
│       └── step{N}-output.json # Step 실행 결과 (자동 생성)
├── CLAUDE.md                   # 새 프로젝트에 복붙해 쓰는 규칙 템플릿
└── .gitignore
```

---

## 핵심 컴포넌트

### `scripts/execute.py` — Step 실행 엔진

`StepExecutor` 클래스가 Phase 내 Step을 순차 실행한다.

| 기능 | 설명 |
|------|------|
| 브랜치 관리 | `feat-{phase-name}` 브랜치를 자동 생성/checkout |
| 가드레일 주입 | `CLAUDE.md` + `docs/*.md`를 매 Step 프롬프트에 포함 |
| 컨텍스트 누적 | 완료된 Step의 `summary`를 다음 Step에 전달 |
| 자가 교정 | 실패 시 에러 메시지를 피드백해 최대 3회 재시도 |
| 2단계 커밋 | 코드 변경(`feat`)과 메타데이터(`chore`)를 분리 커밋 |
| 타임스탬프 | `started_at`, `completed_at`, `failed_at`, `blocked_at` 자동 기록 |

### `.claude/commands/harness.md` — `/harness` 커맨드

Claude Code에서 `/harness`를 입력하면 실행되는 워크플로우:

1. **탐색** — `docs/` 문서를 읽고 프로젝트 파악
2. **논의** — 기술적 결정 사항을 사용자와 논의
3. **Step 설계** — 구현 계획을 Step 초안으로 작성, 피드백 요청
4. **파일 생성** — `phases/` 하위 JSON + Markdown 파일 생성
5. **실행** — `execute.py`로 자동 실행

### `.claude/commands/review.md` — `/review` 커맨드

변경 사항을 `CLAUDE.md`, `ARCHITECTURE.md`, `ADR.md` 기준으로 검증한다.
아키텍처 준수 / 기술 스택 / 테스트 존재 / CRITICAL 규칙 / 빌드 가능 여부를 테이블로 출력.

### `.claude/settings.json` — 안전 훅

```json
{
  "hooks": {
    "PreToolUse": [위험 Bash 명령어 자동 차단],
    "Stop":       [세션 종료 시 lint + build + test 자동 실행]
  }
}
```

차단 패턴: `rm -rf`, `git push --force`, `git reset --hard`, `DROP TABLE`

---

## 사용법

### 1. Phase/Step 파일 설계 (`/harness`)

Claude Code에서 `/harness`를 입력해 워크플로우를 시작한다.
Claude가 `phases/` 하위에 아래 파일들을 생성해준다.

**`phases/index.json`** — 전체 Phase 목록:
```json
{
  "phases": [
    { "dir": "0-mvp", "status": "pending" }
  ]
}
```

**`phases/{phase-name}/index.json`** — Phase 내 Step 목록:
```json
{
  "project": "my-project",
  "phase": "0-mvp",
  "steps": [
    { "step": 0, "name": "project-setup", "status": "pending" },
    { "step": 1, "name": "api-layer",     "status": "pending" }
  ]
}
```

**`phases/{phase-name}/step{N}.md`** — 각 Step 지시서:
```markdown
# Step 0: project-setup

## 읽어야 할 파일
- /docs/ARCHITECTURE.md

## 작업
{구체적인 구현 지시}

## Acceptance Criteria
\`\`\`bash
npm run build && npm test
\`\`\`
```

### 2. 실행

```bash
# Phase 순차 실행
python3 scripts/execute.py 0-mvp

# 실행 완료 후 원격 브랜치에 push
python3 scripts/execute.py 0-mvp --push
```

### 3. Step 상태 및 에러 복구

| 상태 | 의미 | 복구 방법 |
|------|------|----------|
| `pending` | 미실행 | — |
| `completed` | 성공 | — |
| `error` | 3회 시도 후 실패 | `status`를 `"pending"`으로 변경, `error_message` 삭제 후 재실행 |
| `blocked` | 사용자 개입 필요 | `blocked_reason` 해결 후 `status`를 `"pending"`으로 변경, `blocked_reason` 삭제 후 재실행 |

---

## 새 프로젝트에 적용하기

1. 이 저장소를 복제하거나 파일을 복사한다.
2. `CLAUDE.md`의 `{플레이스홀더}`를 프로젝트에 맞게 채운다.
3. `docs/` 하위 템플릿(ARCHITECTURE, ADR, PRD)을 프로젝트에 맞게 작성한다.
4. Claude Code에서 `/harness`를 입력해 첫 Phase를 설계한다.

---

## 개발 내역

| 커밋 | 변경 내용 |
|------|----------|
| `8a43974` | 초기 뼈대 — `.claude/`, `docs/`, `scripts/` 기본 구조 설정 |
| `4f782c9` | `docs/UI_GUIDE.md` 추가 — AI 생성 UI 안티패턴 가이드 포함 |
| `a47cc27` | `scripts/execute.py`를 클래스 기반(`StepExecutor`)으로 리팩토링, `test_execute.py` 테스트 suite(45개+) 추가, `/harness` 커맨드 spec 강화 |
| `da676bc` | `.gitignore` 추가 — 빌드 아티팩트 및 phase 출력 파일 제외 |

---

## 테스트

```bash
# execute.py 테스트 실행 (pytest 필요)
pytest scripts/test_execute.py -v
```

---

## 요구사항

- Python 3.9+
- [Claude Code CLI](https://claude.ai/code) (claude 명령어)
- Git

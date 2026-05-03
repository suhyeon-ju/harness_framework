# Harness Framework 아키텍처

## 디렉토리 구조

```
harness_framework/
├── .claude/
│   ├── commands/           # Claude Code 슬래시 커맨드 정의
│   │   ├── harness.md      # /harness — Phase/Step 설계 워크플로우
│   │   └── review.md       # /review — 아키텍처 준수 검증
│   ├── settings.json       # 훅 설정 (안전 차단 + 자동 테스트)
│   └── settings.local.json # 로컬 전용 권한
├── docs/                   # 프로젝트 템플릿 문서 (새 프로젝트 작성용)
│   ├── ARCHITECTURE.md
│   ├── ADR.md
│   ├── PRD.md
│   └── UI_GUIDE.md
├── scripts/
│   ├── execute.py          # Step 실행 엔진
│   └── test_execute.py     # pytest 테스트 suite
├── phases/                 # (런타임 생성) Phase/Step 파일 저장소
│   ├── index.json
│   └── {phase-name}/
│       ├── index.json
│       ├── step{N}.md
│       └── step{N}-output.json
└── CLAUDE.md               # 새 프로젝트용 규칙 템플릿
```

## 실행 흐름

```
execute.py 호출
    │
    ├─ 1. Phase 디렉토리 검증
    ├─ 2. error/blocked Step 사전 체크
    ├─ 3. feat-{phase} 브랜치 checkout
    ├─ 4. 가드레일 로드 (CLAUDE.md + docs/*.md)
    ├─ 5. created_at 타임스탬프 기록
    │
    └─ Step 실행 루프 ──────────────────────────────────────┐
           │                                                │
           ├─ pending Step 탐색 → 없으면 완료               │
           ├─ started_at 기록                               │
           │                                                │
           └─ 단일 Step 실행 (최대 3회 재시도)              │
                  │                                         │
                  ├─ 이전 Step summary 누적 컨텍스트 구성   │
                  ├─ preamble 구성 (가드레일 + 컨텍스트     │
                  │              + 에러 피드백)             │
                  ├─ Claude CLI 호출                        │
                  ├─ index.json에서 status 확인             │
                  │                                         │
                  ├─ completed → 2단계 커밋 → 다음 Step ───┘
                  ├─ blocked   → 커밋 + 종료 (exit 2)
                  └─ error     → retry < 3: 재시도
                               → retry == 3: 커밋 + 종료 (exit 1)
```

## Step 상태 머신

```
         ┌─────────┐
    ─────▶ pending │
         └────┬────┘
              │ Claude 실행
         ┌────▼──────────────────┐
         │   Claude 실행 중       │
         └────┬──────────────────┘
              │
    ┌─────────┼─────────────┐
    │         │             │
┌───▼───┐ ┌──▼───┐  ┌──────▼──────┐
│completed│ │error │  │  blocked   │
└─────────┘ └──┬───┘  └────────────┘
               │ status → "pending"
               │ (수동 복구)
               └──────────────────▶ pending
```

## 커밋 전략

Step 완료 시 두 번의 커밋을 분리해 히스토리를 정리한다.

```
feat({phase}): step {N} — {name}    ← 코드 변경 (output 파일 제외)
chore({phase}): step {N} output     ← index.json + output.json
```

Phase 완료 시:
```
chore({phase}): mark phase completed
```

## 훅 설계

`.claude/settings.json`에 두 가지 훅이 설정되어 있다.

**PreToolUse (Bash)** — 위험 명령어 사전 차단:
- 차단 패턴: `rm -rf`, `git push --force`, `git reset --hard`, `DROP TABLE`
- Claude가 해당 명령어를 실행하려 하면 exit 1로 차단

**Stop** — 세션 종료 시 자동 품질 검증:
- `npm run lint && npm run build && npm run test` 순차 실행
- 실패 시 결과가 사용자에게 표시됨

## 가드레일 주입 방식

매 Step 실행 시 `CLAUDE.md`와 `docs/*.md`의 내용이 프롬프트 앞에 자동 주입된다.
새 프로젝트에 harness를 적용할 때 이 파일들에 프로젝트 규칙을 작성하면,
별도 설정 없이 모든 Step에서 규칙이 강제된다.

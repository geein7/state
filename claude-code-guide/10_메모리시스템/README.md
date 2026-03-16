# 메모리 시스템

## 두 가지 메모리 메커니즘

| 항목 | CLAUDE.md | 자동 메모리 |
|------|-----------|------------|
| 작성자 | 사용자 | Claude (자동) |
| 내용 | 지침 & 규칙 | 학습 내용 & 패턴 |
| 범위 | 프로젝트/사용자/조직 | 작업 디렉토리별 |
| 로드 | 매 세션 | 처음 200줄 매 세션 |
| 용도 | 표준 & 워크플로우 | 빌드 명령, 인사이트 |

## CLAUDE.md 파일

### 위치 (범위별)

| 위치 | 범위 |
|------|------|
| `/etc/claude-code/CLAUDE.md` | 조직 전체 |
| `./CLAUDE.md` 또는 `./.claude/CLAUDE.md` | 팀 공유 |
| `~/.claude/CLAUDE.md` | 개인 (모든 프로젝트) |

### 모범 사례
- 200줄 미만 유지
- 마크다운 헤더로 구조화
- 구체적이고 명확한 지침 작성
- 충돌하는 규칙 제거

### 고급 기능
```markdown
# 다른 파일 포함
@path/to/import.md

# 경로별 규칙 (프론트매터)
---
paths:
  - "src/api/**/*.ts"
---
# API 개발 규칙
```

### 모듈화 구조
```
.claude/
├── CLAUDE.md
└── rules/
    ├── code-style.md
    ├── testing.md
    └── frontend/
        └── react-conventions.md
```

## 자동 메모리

- **저장 위치**: `~/.claude/projects/<프로젝트>/memory/`
- `MEMORY.md` (인덱스, 세션 시작 시 처음 200줄 로드)
- 토픽 파일 (필요 시 로드)

### 활성화/비활성화
```bash
# 비활성화
CLAUDE_CODE_DISABLE_AUTO_MEMORY=1 claude

# settings.json에서
{ "autoMemoryEnabled": false }
```

## 메모리 명령어

| 명령어 | 설명 |
|--------|------|
| `/memory` | CLAUDE.md 및 자동 메모리 보기/편집 |
| `/init` | CLAUDE.md 자동 초기화 |

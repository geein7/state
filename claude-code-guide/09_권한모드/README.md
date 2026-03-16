# 권한 모드

## 5가지 권한 모드

| 모드 | 동작 |
|------|------|
| `default` | 각 도구 첫 사용 시 확인 요청 |
| `acceptEdits` | 세션 동안 파일 편집 자동 수락 |
| `plan` | 읽기 전용 분석 (파일/명령 실행 없음) |
| `dontAsk` | 사전 승인된 것 외 자동 거부 |
| `bypassPermissions` | 모든 확인 건너뜀 (위험 - 격리 환경에서만 사용) |

## 권한 규칙 문법

### 모든 사용 일치
```json
"deny": ["Bash", "Edit"]
```

### 특정 작업 일치
```json
"allow": [
  "Bash(npm run build)",
  "Edit(/src/**/*.ts)",
  "WebFetch(domain:github.com)"
]
```

### 와일드카드 패턴 (Bash 전용)
```json
"allow": [
  "Bash(npm run *)",
  "Bash(git * main)",
  "Bash(* --version)"
]
```

## 도구별 규칙

| 도구 | 문법 |
|------|------|
| Bash | `Bash(명령어)` - glob 패턴 지원 |
| Read/Edit | gitignore 패턴 (상대/절대/홈 경로) |
| WebFetch | `WebFetch(domain:example.com)` |
| MCP | `mcp__서버명__도구명` |
| Agent | `Agent(에이전트명)` 또는 `Agent(a1, a2)` |

## 권한 우선순위

1. Managed 설정 (관리자 제어) - 최고
2. CLI 플래그
3. Local 설정
4. Project 설정
5. User 설정

> **거부 규칙 우선** - 어디서든 거부되면 모든 곳에서 차단됩니다.

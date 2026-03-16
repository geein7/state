# 훅 시스템

훅은 Claude Code의 라이프사이클 특정 시점에 실행되는 사용자 정의 쉘 명령어입니다.
LLM 결정에 의존하지 않고 규칙을 결정론적으로 적용할 수 있습니다.

## 훅 이벤트

| 이벤트 | 발생 시점 |
|--------|-----------|
| `SessionStart` | 세션 시작 또는 재개 시 |
| `UserPromptSubmit` | 프롬프트 제출 시 |
| `PreToolUse` | 도구 실행 전 (차단 가능) |
| `PostToolUse` | 도구 성공 후 |
| `PostToolUseFailure` | 도구 실패 후 |
| `PermissionRequest` | 권한 다이얼로그 표시 시 |
| `Notification` | Claude가 주의 필요 시 |
| `ConfigChange` | 설정 파일 변경 시 |
| `Stop` | Claude 응답 완료 시 |
| `SessionEnd` | 세션 종료 시 |

## 훅 타입

| 타입 | 설명 |
|------|------|
| `command` | 쉘 스크립트 실행 |
| `http` | 엔드포인트에 POST 요청 |
| `prompt` | 단일 턴 LLM 결정 |
| `agent` | 도구 포함 멀티턴 검증 |

## 설정 파일 위치

| 위치 | 범위 |
|------|------|
| `~/.claude/settings.json` | 모든 프로젝트 (사용자) |
| `.claude/settings.json` | 단일 프로젝트 (공유) |
| `.claude/settings.local.json` | 단일 프로젝트 (개인) |

## 종료 코드

| 코드 | 의미 |
|------|------|
| `0` | 허용 (PreToolUse), stdout으로 컨텍스트 주입 |
| `2` | 차단 (PreToolUse), stderr로 이유 반환 |
| 기타 | 동작 진행, stderr 로그 기록 |

## 활용 예시

1. **알림** - Claude 입력 필요 시 데스크탑 알림
2. **자동 포맷** - 파일 편집 후 Prettier 실행
3. **파일 보호** - 보호 파일 편집 차단
4. **컨텍스트 주입** - 압축 후 컨텍스트 재주입
5. **감사 로그** - 설정 변경 추적

## 설정 예시

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "type": "command",
        "matcher": "Edit",
        "command": "npx prettier --write $CLAUDE_TOOL_INPUT_PATH"
      }
    ]
  }
}
```

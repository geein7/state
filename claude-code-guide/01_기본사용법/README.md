# 기본 사용법

## 핵심 명령어

| 명령어 | 설명 |
|--------|------|
| `claude` | 대화형 세션 시작 |
| `claude "질문"` | 특정 질문으로 시작 |
| `claude -p "질문"` | 응답 출력 후 종료 (SDK 모드) |
| `claude -c` | 가장 최근 대화 이어서 |
| `claude -r "<세션>" "질문"` | 특정 세션 재개 |
| `claude update` | 최신 버전으로 업데이트 |
| `claude auth login` | 인증 로그인 |
| `claude mcp` | MCP 서버 설정 |
| `claude agents` | 서브에이전트 목록 |

## 주요 CLI 플래그

| 플래그 | 설명 |
|--------|------|
| `--add-dir <경로>` | 추가 작업 디렉토리 |
| `--agent <이름>` | 사용할 에이전트 지정 |
| `--continue / -c` | 가장 최근 대화 재개 |
| `--debug` | 디버그 로그 활성화 |
| `--effort [low\|medium\|high\|max]` | 노력 수준 설정 |
| `--model` | AI 모델 설정 (sonnet, opus, haiku) |
| `--name / -n` | 세션 이름 설정 |
| `--permission-mode` | 권한 모드 설정 |
| `--print / -p` | 응답 출력 후 종료 |
| `--system-prompt` | 커스텀 시스템 프롬프트 |
| `--tools` | 사용 가능한 도구 제한 |
| `--worktree / -w` | git worktree에서 시작 |

## 입력 모드

| 방법 | 사용법 |
|------|--------|
| 여러 줄 입력 | `\` + `Enter` 또는 `Shift+Enter` |
| Bash 모드 | `!` 접두사로 직접 명령 실행 |
| 자동완성 | `Tab` 으로 제안 수락 |
| 파일 언급 | `@` 으로 파일/폴더 참조 |
| 슬래시 명령어 | `/` 로 시작 |

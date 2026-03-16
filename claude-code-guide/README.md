# 클로드 코드 사용법 가이드

Claude Code의 주요 기능을 정리한 가이드입니다.

## 목차

| 폴더 | 내용 |
|------|------|
| [01_기본사용법](./01_기본사용법/README.md) | CLI 명령어, 플래그, 기본 사용 방법 |
| [02_슬래시명령어](./02_슬래시명령어/README.md) | `/config`, `/agents`, `/memory` 등 |
| [03_단축키](./03_단축키/README.md) | 키보드 단축키 전체 목록 |
| [04_MCP서버](./04_MCP서버/README.md) | MCP 서버 설치 및 관리 |
| [05_훅시스템](./05_훅시스템/README.md) | 훅 이벤트, 타입, 설정 방법 |
| [06_설정](./06_설정/README.md) | 설정 파일, 스코프, 주요 옵션 |
| [07_IDE통합](./07_IDE통합/README.md) | VS Code, JetBrains, Chrome 확장 |
| [08_서브에이전트](./08_서브에이전트/README.md) | 서브에이전트 생성 및 활용 |
| [09_권한모드](./09_권한모드/README.md) | 권한 모드 5가지, 규칙 문법 |
| [10_메모리시스템](./10_메모리시스템/README.md) | CLAUDE.md, 자동 메모리 |

## 빠른 시작

```bash
# 설치
npm install -g @anthropic-ai/claude-code

# 실행
claude

# 특정 질문으로 시작
claude "이 코드를 설명해줘"

# 마지막 대화 이어서
claude -c
```

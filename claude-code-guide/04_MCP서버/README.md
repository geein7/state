# MCP 서버

MCP(Model Context Protocol)는 Claude Code를 외부 도구, 데이터베이스, API, 서비스에 연결하는 개방형 표준입니다.

## 설치 방법

### 원격 HTTP 서버 (권장)
```bash
claude mcp add --transport http <이름> <URL>
claude mcp add --transport http notion https://mcp.notion.com/mcp
```

### 로컬 Stdio 서버
```bash
claude mcp add --transport stdio --env KEY=VALUE <이름> -- npx -y <패키지>
claude mcp add --transport stdio airtable -- npx -y airtable-mcp-server
```

## 관리 명령어

| 명령어 | 설명 |
|--------|------|
| `claude mcp list` | 모든 서버 목록 |
| `claude mcp get <이름>` | 특정 서버 상세 정보 |
| `claude mcp remove <이름>` | 서버 제거 |
| `/mcp` | 서버 상태 확인 및 OAuth 인증 |

## 스코프 옵션

| 스코프 | 위치 | 공유 범위 |
|--------|------|-----------|
| `local` (기본값) | `~/.claude.json` | 개인 + 현재 프로젝트 |
| `project` | `.mcp.json` | 팀 공유 (git) |
| `user` | `~/.claude.json` | 개인 + 모든 프로젝트 |

## 사용 방법

- MCP 리소스 참조: `@서버명:protocol://resource/path`
- OAuth 인증: `/mcp` 명령어 사용
- MCP 프롬프트는 자동으로 사용 가능한 명령어가 됨
- 컨텍스트 10% 이상 사용 시 도구 검색 자동 활성화

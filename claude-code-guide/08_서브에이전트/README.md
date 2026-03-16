# 서브에이전트

특정 작업을 처리하는 전문화된 AI 어시스턴트입니다.
독립적인 컨텍스트 윈도우, 커스텀 프롬프트, 특정 도구 접근, 독립적인 권한을 가집니다.

## 내장 서브에이전트

| 이름 | 모델 | 도구 | 목적 |
|------|------|------|------|
| **Explore** | Haiku | 읽기 전용 | 빠른 코드베이스 분석 |
| **Plan** | 상속 | 읽기 전용 | 안전한 사전 분석 |
| **General-purpose** | 상속 | 모두 | 복잡한 멀티스텝 작업 |

## 커스텀 서브에이전트 생성

### 파일 위치 (우선순위 순)
1. `--agents` CLI 플래그 - 단일 세션
2. `.claude/agents/` - 프로젝트 (공유)
3. `~/.claude/agents/` - 사용자 (모든 프로젝트)
4. 플러그인의 `agents/` - 플러그인 배포

### 파일 형식 (마크다운 + YAML 프론트매터)

```markdown
---
name: code-reviewer
description: 코드 품질을 검토합니다
tools: Read, Grep, Glob
model: sonnet
permissionMode: plan
---

당신은 코드 리뷰어입니다...
```

### 프론트매터 필드

| 필드 | 설명 |
|------|------|
| `name` (필수) | 고유 식별자 |
| `description` (필수) | 위임 시점 설명 |
| `tools` | 허용 도구 (생략 시 상속) |
| `disallowedTools` | 차단 도구 |
| `model` | AI 모델 (sonnet, opus, haiku, inherit) |
| `permissionMode` | 권한 모드 오버라이드 |
| `maxTurns` | 최대 턴 수 |
| `background` | 백그라운드 작업으로 실행 |
| `isolation` | git worktree 격리 |

## 관리

- `/agents` - 대화형 에이전트 관리
- `claude agents` - CLI에서 목록 확인
- 자동 위임: 작업 설명 기반
- 수동 위임: "X 서브에이전트를 사용해서..."

## 활용 패턴

1. **복잡한 작업 격리** - 테스트/로그를 서브에이전트로, 요약만 반환
2. **병렬 리서치** - 여러 서브에이전트가 독립적으로 조사
3. **작업 체인** - 순차적 서브에이전트 작업
4. **도구 제한** - 읽기 전용 리뷰어, 쓰기 전용 구현자

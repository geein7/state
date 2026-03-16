# 설정

## 설정 스코프 (우선순위 순)

1. **Managed** (최고) - 시스템 수준, IT 관리
2. **CLI 인수** - 세션 오버라이드
3. **Local** (`.claude/settings.local.json`) - 프로젝트 개인
4. **Project** (`.claude/settings.json`) - 팀 공유
5. **User** (`~/.claude/settings.json`) - 모든 프로젝트

## 주요 설정 카테고리

### 권한 설정
```json
{
  "permissions": {
    "allow": ["Bash(npm run *)", "Edit(src/**/*.ts)"],
    "ask": ["WebFetch"],
    "deny": ["Bash(rm -rf *)"]
  },
  "defaultMode": "default"
}
```

### 보안 설정
```json
{
  "sandbox": true,
  "additionalDirectories": ["/path/to/extra/dir"]
}
```

### 모델 설정
```json
{
  "model": "claude-sonnet-4-6",
  "effort": "high",
  "fastModeEnabled": false
}
```

### 동작 설정
```json
{
  "autoMemoryEnabled": true,
  "defaultWorkingDirectory": "/path/to/project",
  "contextCompactionThreshold": 0.8
}
```

## 설정 접근 방법

- `/config` - 대화형 UI
- JSON 직접 편집 - 세밀한 제어
- CLI 플래그 - 세션 오버라이드

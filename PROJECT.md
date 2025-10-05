# AI Token Tracker

토큰 사용량 추적 라이브러리 프로젝트

## 설치 및 실행

```bash
# 의존성 설치
npm install

# TypeScript 빌드
npm run build

# 개발 모드 (watch)
npm run dev
```

## 프로젝트 구조

```
cost-tracker/
├── .claude/
│   └── learning.txt      # Claude 학습 문서
├── src/
│   ├── index.ts         # 메인 진입점
│   ├── tracker.ts       # 핵심 추적 로직
│   ├── pricing.ts       # 가격 계산
│   └── providers/
│       ├── openai.ts    # OpenAI 래퍼
│       └── anthropic.ts # Claude 래퍼
├── examples/
│   └── basic-usage.ts   # 사용 예제
├── package.json
├── tsconfig.json
└── README.md
```

## 주요 기능

1. **OpenAI API 추적**
   - GPT-3.5, GPT-4 모델
   - DALL-E 이미지 생성
   - Whisper 음성 인식
   - 임베딩 모델

2. **Anthropic Claude API 추적**
   - Claude 3 Opus, Sonnet, Haiku
   - 스트리밍 응답 지원

3. **비용 계산**
   - 실시간 토큰 카운팅
   - 모델별 차등 요금
   - USD/KRW 통화 지원

4. **사용자 관리**
   - 사용자별 추적
   - 사용 내역 조회
   - 세션 기반 관리

## 다음 단계

1. npm 패키지 배포 준비
2. 테스트 코드 작성
3. CI/CD 설정
4. 문서화 개선

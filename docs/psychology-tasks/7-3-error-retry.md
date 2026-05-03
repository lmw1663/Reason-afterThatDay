# 7-3. 분석/졸업 저장 실패 시 재시도 UI 🟢 P1-A

> **Phase**: 7 — 기술 안정성 + 감정 안전장치
> **우선순위**: P1-A (의존성 없음)
> **마이그레이션**: 없음 (UI/로직만)
> **출처**: `TODO(psychology).md` 라인 3174-3281

---

**심리학 근거**
- 분석/졸업은 **의식적 행위** → 조용한 실패는 "거부 신호"로 해석될 수 있음
- 사용자: "내 결단이 받아들여지지 않았나?"

**현재 상태**

```
save 실패 → console.warn만 → 사용자는 모름
          → 조용한 조용한 처리
```

**개선 방향**

```
save 실패 → ErrorToast 표시
         → [재시도] 버튼 제공
         → 명시적 피드백
```

### 구현 방식

**에러 토스트 개선**

```typescript
// screens/analysis/result.tsx

const handleSaveAnalysis = async () => {
  try {
    setIsLoading(true);
    await upsertRelationshipProfile(data);
    // 성공 (반말 톤)
    showToast("분석이 저장됐어. 🎯");
  } catch (error) {
    // 실패 → 재시도 UI (반말 톤)
    setError(error);
    showErrorToast(
      "저장이 안 됐어. 다시 시도해볼까?",
      {
        action: "재시도",
        onPress: handleSaveAnalysis  // 재귀 호출
      }
    );
  } finally {
    setIsLoading(false);
  }
};
```

**ErrorToast 컴포넌트**

```typescript
interface ErrorToastProps {
  message: string;
  action?: {
    label: string;
    onPress: () => Promise<void>;
  };
  duration?: number;
}

export const ErrorToast = ({
  message,
  action,
  duration = 5000
}: ErrorToastProps) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await action!.onPress();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {action && (
        <Button
          onPress={handleRetry}
          disabled={isRetrying}
          title={isRetrying ? "시도 중..." : action.label}
          style={styles.actionButton}
        />
      )}
    </View>
  );
};
```

**적용 대상 화면**

1. `/analysis/result` — "분석 저장 실패"
2. `/compass/needle` — "나침반 결정 저장 실패"
3. `/graduation/request` — "졸업 신청 저장 실패"

**구현 순서**
1. `ErrorToast` 컴포넌트 개선 (action 버튼 추가)
2. 분석/나침반/졸업 save 로직에 try-catch 적용
3. 에러 화면별로 메시지 맞춤화
4. 테스트 (오프라인 시뮬레이션 → 재시도)

---

## 관련 문서

- 📁 [README.md](README.md) — 전체 인덱스
- 📋 [00-overview.md](00-overview.md) — 톤 정책 + 마이그레이션 일람

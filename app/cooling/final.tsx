import { Redirect } from 'expo-router';

/**
 * 쿨링 final — A-4
 *
 * 졸업 트랙 보류 중. deep link 직접 진입도 paused 안내로 차단.
 * 원본 화면(7일 최종 확인 + confirmGraduation 호출)은 git history에 보존.
 *
 * 보류 해제 시 복원 절차:
 *  1. `git show b956d4f:app/cooling/final.tsx` (또는 그 이전 커밋)에서 원본 본문 복사
 *  2. cooling/index.tsx의 "마무리 안내 보기" 버튼을 "최종 졸업 확인" + `/cooling/final`로 원복
 *  3. graduation/_layout.tsx의 Redirect를 원래 Stack으로 복원
 *  4. (tabs)/graduation.tsx도 git history에서 원본 복원
 */
export default function CoolingFinalScreen() {
  return <Redirect href="/graduation-paused" />;
}

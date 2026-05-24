/**
 * 탭 전환 슬라이드 방향 공유.
 *
 * TabBar(onPress)가 이동 *직전* 방향을 기록하고, ScreenWrapper(entrance="slide")가
 * focus 시점에 읽어 새 화면이 어느 쪽에서 들어올지 결정한다.
 *  -  1 = 더 오른쪽 탭으로 이동 → 새 화면이 오른쪽에서 슬라이드 (오늘→기록→나)
 *  - -1 = 더 왼쪽 탭으로 이동  → 새 화면이 왼쪽에서 슬라이드  (나→기록→오늘)
 *
 * 모듈 변수로 동기 읽기/쓰기 — onPress가 navigate 전에 set하므로, 직후 마운트/포커스되는
 * 화면의 useFocusEffect가 항상 올바른 방향을 읽는다. (리렌더 의존 없음)
 */
let direction = 1;

export const tabSlideDirection = {
  get: () => direction,
  set: (next: number) => {
    direction = next < 0 ? -1 : 1;
  },
};

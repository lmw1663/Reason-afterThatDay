import { Redirect } from 'expo-router';

/**
 * 매듭 탭 진입점 — F-4 (placeholder)
 *
 * 사용자가 권유 모달 승낙 시 useKnotStore.recordAccept()로 매듭 탭이 노출되며,
 * 진입하면 기존 graduation 흐름의 진입점(report)으로 라우팅한다.
 *
 * F-7에서 본 컴포넌트를 페르소나별 라벨·진행 상태에 따른 본 진입 화면으로 교체 예정.
 * /knot/* alias 경로도 그때 추가.
 */
export default function KnotEntry() {
  return <Redirect href="/graduation/report" />;
}

import type { IconName } from '@/components/ui/Icon';
import type { PersonaCode } from '@/utils/personaClassifier';

/**
 * 페르소나 우선 카드 정의 — A-6 / C-2-G-2
 *
 * 매트릭스 §2 C2 셀의 페르소나별 우선 카드를 코드 데이터로 정형화.
 * `usePersonaStore`의 활성 페르소나로 PersonaPriorityCard 컴포넌트가 본 매핑 조회.
 *
 * 라벨 비노출 원칙: 카드 *내용*만 페르소나별로 다름. 카드 제목·이미지에 페르소나 코드/명 노출 금지.
 *
 * PersonaCode SSOT: utils/personaClassifier.ts (P13 제외 19종, C-1-2 정책).
 * P13(사별)은 분류기가 반환하지 않으므로 본 매핑에서도 제외 — 키 자체가 없어야 타입 정합.
 */

// PersonaCode는 utils/personaClassifier에서 import (P13 제외 19종 SSOT)
export type { PersonaCode };

export interface PersonaCard {
  icon: IconName;
  title: string;
  subtitle: string;
  /** 라우트 미존재 시 안내 화면 또는 가까운 기존 화면으로 fallback */
  route: string;
}

/**
 * P12(안정형) baseline은 카드 노출 없음 — null.
 * 다른 페르소나는 매트릭스 §2 C2 셀의 액션을 카드로 변환.
 * P13은 PersonaCode 타입에서 제외됐으므로 본 Record에 키가 없음.
 */
export const PERSONA_CARDS: Record<PersonaCode, PersonaCard | null> = {
  P01: { icon: 'scale',           title: '오늘 하나, 사실 정리',     subtitle: '해석 말고 그날 있었던 일만',         route: '/about-me' },
  P02: { icon: 'thermometer',     title: '오늘 너의 몸 신호',         subtitle: '잠·식욕·멍함부터 살펴봐',           route: '/about-me' },
  // P03 충동 지연 도구는 미구현 — 임시 fallback으로 일반 일기 화면. TODO: app/journal/urge.tsx 신설
  P03: { icon: 'hourglass',       title: '연락하고 싶을 때 도구',     subtitle: '10분 호흡 후 다시 마음 보기',       route: '/journal/today' },
  P04: { icon: 'book',            title: '오늘 읽을 거 하나',         subtitle: '지금 정상적인 반응이야',            route: '/about-me' },
  P05: { icon: 'pen',             title: '결정 직후 일기 다시 보기',   subtitle: '왜 끝냈는지 그때의 너에게',         route: '/journal/history' },
  P06: { icon: 'undo',            title: '이전 사이클 타임라인',       subtitle: '이번엔 어떤 트리거였어?',           route: '/about-me' },
  P07: { icon: 'leaf',            title: '회복 가능성',                subtitle: '첫 이별이 가장 강렬한 이유',         route: '/about-me' },
  P08: { icon: 'puzzle',          title: '잃어버린 나 찾기',           subtitle: '관계 안에서 사라진 너의 조각',      route: '/about-me' },
  P09: { icon: 'heart',           title: '오늘 너만의 작은 욕구',      subtitle: '배고픔·졸림부터 되찾자',            route: '/about-me' },
  // P10 거칠게 모드(raw-mode)는 미구현 — 임시 fallback. TODO D-5: app/journal/raw-mode.tsx
  P10: { icon: 'sparkles',        title: '몸을 흔들어보자',            subtitle: '운동·찬물 세수·부치지 않을 편지',   route: '/journal/today' },
  P11: { icon: 'heart-handshake', title: '오늘의 작은 루틴 1개',       subtitle: '두 마음이 같이 있는 게 정상',       route: '/about-me' },
  P12: null,
  // P13 사별 — PersonaCode 타입에서 제외됨 (C-1-2). 본 Record 키에 들어갈 수 없음.
  P14: { icon: 'clipboard',       title: '책임 행동 분해',             subtitle: '사과·관계 회피·재발 방지를 행동으로', route: '/about-me' },
  // P15 행정 체크리스트 탭은 미구현 — 임시 fallback. TODO C-2-G-8: app/cooling/admin.tsx
  P15: { icon: 'archive',         title: '행정 체크리스트',            subtitle: '짐·계약·청구·주소이전·공동계좌',     route: '/cooling' },
  P16: { icon: 'users',           title: '법률·재무 자원',             subtitle: '회복은 주(weeks) 단위로',           route: '/about-me' },
  // P17 미완의 말 일기 템플릿은 미구현 — 임시 fallback. TODO C-2-G-3: app/journal/unfinished.tsx
  P17: { icon: 'feather',         title: '미완의 말 글쓰기',           subtitle: '통제할 수 없었던 것을 인정',        route: '/journal/today' },
  P18: { icon: 'bell',            title: '마주침 예측',                subtitle: '이전·이후 정서 조절 도구',          route: '/about-me' },
  P19: { icon: 'moon',            title: '오늘은 결정하지 않기',       subtitle: '의심을 흘려보내는 연습',            route: '/about-me' },
  P20: { icon: 'award',           title: '단절 N일째',                 subtitle: '도파민 사이클을 끊는 카운터',       route: '/about-me' },
};

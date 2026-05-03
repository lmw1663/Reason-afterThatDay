/**
 * 약관 동의 정의 — A-1
 *
 * 약관/방침 갱신 시 해당 항목의 version만 올리면 useUserStore가 자동으로 재동의를 요청한다.
 * users.consent_versions JSONB에 항목별 동의 버전이 기록된다.
 */

export type ConsentKey =
  | 'terms'         // 서비스 이용약관
  | 'privacy'       // 개인정보 처리방침
  | 'sensitive'     // 민감정보 수집 (심리 척도)
  | 'persona'       // 자동 페르소나 분류
  | 'crisis'        // 위기 응답 수집
  | 'safety_lock';  // C-SSRS 양성 시 자동 동작 (졸업 잠금 등)

export interface ConsentItem {
  key: ConsentKey;
  required: true;     // 모든 항목 필수 — 거부 시 가입 불가
  title: string;
  summary: string;    // 1줄 요약
  version: string;    // semver — 갱신 시 재동의 강제
  documentSlug?: 'terms' | 'privacy';  // 펼쳐 볼 외부 문서 링크
}

export const CONSENT_ITEMS: ConsentItem[] = [
  {
    key: 'terms',
    required: true,
    title: '서비스 이용약관',
    summary: '본 서비스의 사용 조건과 책임 범위',
    version: 'v1.0.0',
    documentSlug: 'terms',
  },
  {
    key: 'privacy',
    required: true,
    title: '개인정보 처리방침',
    summary: '입력한 정보의 수집·이용·보관 방식',
    version: 'v1.0.0',
    documentSlug: 'privacy',
  },
  {
    key: 'sensitive',
    required: true,
    title: '민감정보 수집·활용 동의',
    summary: '심리 척도(PHQ-9, GAD-7 등) 응답·결과 활용',
    version: 'v1.0.0',
  },
  {
    key: 'persona',
    required: true,
    title: '페르소나 자동 분류 동의',
    summary: '응답 기반 정서 상태 가설 자동 생성 — 언제든 거부·삭제 가능',
    version: 'v1.0.0',
  },
  {
    key: 'crisis',
    required: true,
    title: '위기 응답 수집 동의',
    summary: '자해·자살 사고 평가(C-SSRS) 응답 — 응급 외 제3자 공유 없음',
    version: 'v1.0.0',
  },
  {
    key: 'safety_lock',
    required: true,
    title: '안전 자동 동작 동의',
    summary: '위기 양성 시 24시간 안부 푸시·외부 자원 자동 안내',
    version: 'v1.0.0',
  },
];

/**
 * 모든 필수 항목이 현재 버전과 동일하게 동의되어 있는지 확인.
 */
export function isConsentValid(consentVersions: Record<string, string> | null): boolean {
  if (!consentVersions) return false;
  return CONSENT_ITEMS.every(item => consentVersions[item.key] === item.version);
}

/**
 * 동의 패치 페이로드 생성 — 모든 필수 항목을 현재 버전으로 채움.
 */
export function buildConsentPayload(): Record<string, string> {
  return CONSENT_ITEMS.reduce(
    (acc, item) => ({ ...acc, [item.key]: item.version }),
    {} as Record<string, string>,
  );
}

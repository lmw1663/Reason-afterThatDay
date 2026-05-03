#!/usr/bin/env node
/* eslint-disable */
/**
 * 페르소나 라벨 비노출 검사 — B-4
 *
 * 페르소나 코드(P01~P20)와 진단명-유사 어휘가 *사용자 노출 코드*에 등장하면 fail.
 * 코멘트(//, /*) 안 등장은 허용 (개발자가 분기 의도 설명 가능).
 *
 * 실행:
 *   node scripts/check-persona-labels.js
 *   npm run lint:persona
 *
 * 정책 근거: docs/psychology-logic/페르소나-화면-액션-매트릭스.md §5-2,
 *           CLAUDE.md "페르소나 라벨 노출 금지" 절대 규칙
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

// 검사 대상 파일 패턴 — 사용자 노출 가능성이 있는 코드만
const TARGET_GLOBS = [
  'app/**/*.tsx',
  'components/**/*.tsx',
];

// 예외: 페르소나 정보를 *명시적으로* 다룰 수 있는 파일들 (사용자 노출 화면 한정)
// 코드 데이터(constants/, utils/)는 isTarget에서 자동 제외되므로 별도 명시 불요.
const EXEMPT_PATHS = [
  /^app\/resources\//,                  // 위기 자원 화면 (정보 전달)
  /^app\/legal\//,                      // 법무 문서 화면
  /^app\/onboarding\/consent\.tsx$/,    // 약관 동의 (페르소나 분류 동의 명시 필요)
];

// 금지 어휘 — 페르소나 코드 + 페르소나-분류체계.md의 모든 진단명-유사 어휘
// pattern은 string으로 둬 매 검사마다 fresh RegExp 생성 (lastIndex 누적 버그 방지).
const FORBIDDEN_PATTERNS = [
  // 페르소나 코드 (P01~P20)
  { pattern: '\\bP0[1-9]\\b', label: '페르소나 코드 P01~P09' },
  { pattern: '\\bP1[0-9]\\b', label: '페르소나 코드 P10~P19' },
  { pattern: '\\bP20\\b',     label: '페르소나 코드 P20' },

  // 진단명-유사 어휘 (한국어) — 페르소나명 직접/근사 표기
  { pattern: '가스라이팅',                     label: 'P01 가스라이팅' },
  { pattern: '자기\\s*판단\\s*손상형',         label: 'P01 자기 판단 손상형' },
  { pattern: '회피형\\s*애착',                 label: 'P02 회피형 애착' },
  { pattern: '불안형\\s*애착',                 label: 'P03 불안형 애착' },
  { pattern: '갑작스러운\\s*통보\\s*피해',     label: 'P04 갑작스러운 통보 피해' },
  { pattern: '죄책감형',                       label: 'P05 죄책감형' },
  { pattern: '반복\\s*재회\\s*사이클',         label: 'P06 반복 재회 사이클' },
  { pattern: '첫\\s*이별\\s*충격형',           label: 'P07 첫 이별 충격형' },
  { pattern: '장기\\s*권태',                   label: 'P08 장기 권태' },
  { pattern: '헌신\\s*소진',                   label: 'P09 헌신 소진' },
  { pattern: '분노\\s*지배형',                 label: 'P10 분노 지배형' },
  { pattern: '두려움형\\s*애착',               label: 'P11 두려움형 애착' },
  { pattern: '안정형\\s*회복자',               label: 'P12 안정형 회복자' },
  { pattern: '외도\\s*가해\\s*후회',           label: 'P14 외도 가해 후회' },
  { pattern: '동거\\s*정리형',                 label: 'P15 동거 정리형' },
  { pattern: '결혼[·\\s]*이혼형',              label: 'P16 결혼·이혼형' },
  { pattern: '강제\\s*이별형',                 label: 'P17 강제 이별형' },
  { pattern: '사회적\\s*얽힘',                 label: 'P18 사회적 얽힘' },
  { pattern: '관계\\s*강박',                   label: 'P19 관계 강박' },
  { pattern: '트라우마\\s*본딩',               label: 'P20 트라우마 본딩' },

  // 진단명-유사 어휘 (영문)
  { pattern: '\\bROCD\\b',                     label: 'P19 ROCD' },
  { pattern: '\\bBlindsided\\b',               label: 'P04 Blindsided' },
  { pattern: '\\bCodependent\\b',              label: 'P09 Codependent' },
  { pattern: '\\bOn[\\-\\s]Off\\s*Cycler',     label: 'P06 On-Off Cycler' },
  { pattern: '\\bAnger[\\-\\s]Dominant',       label: 'P10 Anger-Dominant' },
  { pattern: '\\bLogistical\\s*Untangler',     label: 'P15 Logistical Untangler' },
  { pattern: '\\bSame[\\-\\s]Circle',          label: 'P18 Same-Circle' },
  { pattern: '\\bExternally\\s*Forced',        label: 'P17 Externally Forced' },
  { pattern: '\\bLong[\\-\\s]Term\\s*Burnout', label: 'P08 Long-Term Burnout' },
];

const re = (p) => new RegExp(p, 'g');

function listFiles() {
  // tracked + untracked(.gitignore 제외) 모두 검사 — 커밋 전 위반도 잡기 위해.
  // git --others에서 glob이 unreliable하므로 모두 가져와 JS에서 prefix 필터.
  const tracked = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' });
  const untracked = execSync('git ls-files --others --exclude-standard', { cwd: ROOT, encoding: 'utf8' });
  const all = (tracked + '\n' + untracked).split('\n').filter(Boolean);

  const isTarget = (file) =>
    /\.tsx$/.test(file) && (file.startsWith('app/') || file.startsWith('components/'));

  return Array.from(new Set(all.filter(isTarget)));
}

function isExempt(file) {
  return EXEMPT_PATHS.some(re => re.test(file));
}

/**
 * 코멘트 라인 제거 — //, /* ~ * /, JSDoc 블록.
 * 문자열 안 // 등은 단순 처리상 코멘트로 오인할 수 있으나, 본 검사 목적엔 충분.
 */
function stripComments(content) {
  // 블록 코멘트 제거
  let out = content.replace(/\/\*[\s\S]*?\*\//g, '');
  // 라인 코멘트 제거
  out = out.replace(/\/\/[^\n]*/g, '');
  return out;
}

function checkFile(file) {
  const fullPath = path.join(ROOT, file);
  const raw = fs.readFileSync(fullPath, 'utf8');
  const code = stripComments(raw);
  const violations = [];

  for (const { pattern, label } of FORBIDDEN_PATTERNS) {
    const matches = code.match(re(pattern));
    if (matches && matches.length > 0) {
      // 라인 번호 찾기 (코멘트 제거 전 raw에서, 라인별 fresh regex)
      const lines = raw.split('\n');
      const hits = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
        // 인라인 코멘트(//) 뒤는 잘라내고 검사
        const codeOnly = line.split('//')[0];
        if (re(pattern).test(codeOnly)) {
          hits.push(i + 1);
        }
      }
      if (hits.length > 0) {
        violations.push({ label, lines: hits });
      }
    }
  }
  return violations;
}

function main() {
  const files = listFiles();
  const allViolations = [];

  for (const file of files) {
    if (isExempt(file)) continue;
    const violations = checkFile(file);
    if (violations.length > 0) {
      allViolations.push({ file, violations });
    }
  }

  if (allViolations.length === 0) {
    console.log(`✅ 페르소나 라벨 노출 없음 (검사 ${files.length}개 파일)`);
    process.exit(0);
  }

  console.error('🚫 페르소나 라벨이 사용자 노출 코드에 발견되었습니다.');
  console.error('   라벨/코드 노출은 자기충족적 예언 위험으로 금지됩니다.');
  console.error('   (CLAUDE.md 절대 규칙 / 매트릭스 §5-2)\n');

  for (const { file, violations } of allViolations) {
    console.error(`  ${file}`);
    for (const { label, lines } of violations) {
      console.error(`    L${lines.join(',L')}: "${label}"`);
    }
  }

  console.error('\n  예외 허용 경로: app/resources/, app/legal/, app/onboarding/consent.tsx');
  console.error('  코멘트 안 사용은 허용. JSX 본문·문자열 리터럴은 금지.');
  process.exit(1);
}

main();

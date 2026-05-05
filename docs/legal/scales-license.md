# PHQ-9 · GAD-7 · RSE 라이선스 정리

먼저 알아둘 핵심 — **세 척도 모두 사실상 "별도 허가 메일 없이 사용 가능"**입니다. 다만 앱스토어 심사·IRB·내부 컴플라이언스용으로 "근거 문서"가 필요할 뿐이에요. 그래서 실제로 해야 할 일은 **메일 회신을 받는 것**보다 **공식 허가 문구를 PDF/스크린샷으로 보존**하는 것입니다. 그 위에서 추가 확답이 필요한 경우 메일을 보내는 식으로 가면 됩니다.

---

## 1. PHQ-9 / GAD-7 (Pfizer)

### 라이선스 상태
- 2개 척도 모두 **Pfizer 후원으로 개발**되었고, Pfizer가 다음 문구로 **퍼블릭 허가**를 공식 명시했습니다:
  > *"All PHQ, GAD-7 screeners and translations are downloadable from this website and no permission is required to reproduce, translate, display or distribute them."*
- 공식 배포처: **phqscreeners.com** (현재는 Patient Health Questionnaire 관련 페이지로 이전됨 — 인터넷 아카이브에서도 원문 확인 가능)
- 한국어판은 **안제용 외(2013)**, **Seo & Park(2015)** 등이 검증·발표한 번역본을 사용하는 것이 표준이며, 한국어 번역본 자체도 위 허가에 포함됩니다.

### 실제로 해야 할 일

**(A) 1순위 — 공식 허가 문구 보존**
1. phqscreeners.com (또는 web.archive.org에서 archived snapshot) 접속
2. 위 허가 문장이 보이는 페이지 전체를 **PDF로 저장 + 스크린샷**
3. 다운로드한 PHQ-9 / GAD-7 원본 PDF도 같이 보관 (Korean 버전도 함께)
4. 파일명 예: `license/PHQ9_Pfizer_permission_2026-05-04.pdf`

**(B) 추가 확답이 필요한 경우 — 저자에게 직접 메일**
- 수신: **Kurt Kroenke 교수** (Indiana University / Regenstrief Institute) — PHQ-9, GAD-7의 공동 개발자이며 현재 가장 활발한 연락 창구
  - 정확한 메일은 Indiana University School of Medicine 홈페이지에서 "Kurt Kroenke" 검색 → 현재 표시되는 주소 사용 (임의로 적는 것보다 사이트의 최신 주소가 안전)
- 참고로 Robert Spitzer 박사는 2015년에, Janet Williams 박사도 별세하셨기 때문에 Kroenke 교수가 사실상 단독 contact입니다.

### 메일 템플릿 (영문)

```
Subject: Permission inquiry — PHQ-9 and GAD-7 use in a Korean mobile application

Dear Dr. Kroenke,

I am developing a non-commercial mobile application in South Korea
that supports users in emotional recovery after a breakup. I would
like to incorporate the PHQ-9 and GAD-7 as periodic self-screening
tools (Korean validated translations: Ahn et al., 2013; Seo & Park, 2015).

I am aware of the public permission statement issued by Pfizer
indicating that no additional permission is required for reproduction,
translation, display, or distribution. I would simply like written
confirmation that this also covers in-app digital administration in
the context I described, including the Korean translations.

The app:
- Name / scope: [앱 이름], post-breakup self-care
- Use of PHQ-9/GAD-7: voluntary self-screening, scores shown only to
  the user, with crisis hotline guidance for elevated scores
- Distribution: Apple App Store and Google Play (Korea)
- No fee for the screeners; no clinical/diagnostic claims

Thank you very much for your time.

Best regards,
[이름]
[직함 / 소속]
[메일 / 연락처]
```

> 답이 안 와도 (A)의 Pfizer 공식 문구만으로 사실상 충분합니다.

---

## 2. RSE — Rosenberg Self-Esteem Scale

### 라이선스 상태
- 개발자 Morris Rosenberg(1992년 작고) 가족이 권한을 University of Maryland 사회학과에 위임
- 메릴랜드대 사회학과(UMD Department of Sociology)가 다음과 같이 명시:
  > *"The scale is in the public domain... The scale may be used without explicit permission. The Rosenberg family, however, has requested that the use of the scale be referenced..."*
- 즉 **출처 표기만 하면 자유 사용 가능**합니다. 한국어판은 **전병제(1974)** 번역본이 가장 널리 쓰이며, 학술 출판물에 등재된 번역은 공정 인용 범위에서 사용 가능합니다.

### 실제로 해야 할 일

**(A) 1순위 — UMD 사회학과 공식 페이지 보존**
1. 검색: "Using the Rosenberg Self-Esteem Scale" + "University of Maryland Department of Sociology"
2. 공식 페이지(socy.umd.edu 도메인)에 진입해 위 허가 문구가 포함된 페이지를 **PDF + 스크린샷**으로 저장
3. 앱 내·약관·연구 윤리 문서에 다음 식으로 출처 표기:
   > *"Rosenberg, M. (1965). Society and the adolescent self-image. Princeton University Press. 한국어 번역: 전병제(1974)."*

**(B) 추가 확답이 필요한 경우 — UMD 사회학과에 메일**
- 수신: **University of Maryland, Department of Sociology (info / general inquiry 메일)**
  - 메일 주소는 socy.umd.edu의 Contact 페이지에 게시된 학과 사무실 주소 사용 (학과 contact는 종종 바뀌므로 페이지에서 직접 확인)

### 메일 템플릿 (영문)

```
Subject: Confirmation of permission — Rosenberg Self-Esteem Scale in a Korean mobile app

Dear Department of Sociology,

I am developing a Korean-language mobile application focused on
self-reflection after a romantic breakup, and I plan to include the
Rosenberg Self-Esteem Scale (Korean translation: Jeon, 1974) as an
optional periodic self-assessment.

I have read the statement on your departmental website indicating
that the scale is in the public domain and may be used without
explicit permission, with appropriate citation. I would appreciate a
brief written confirmation that this covers in-app digital use as
described, so that I may include it in our compliance documentation.

App information:
- Purpose: post-breakup emotional self-care, non-clinical
- Distribution: Apple App Store / Google Play (Korea)
- No fee for the scale; results shown only to the user
- Citation: Rosenberg, M. (1965). Society and the adolescent
  self-image. Princeton University Press.

Thank you very much.

Sincerely,
[이름]
[소속]
[메일]
```

---

## 3. 최종 체크리스트

| 항목 | 보관 위치 | 비고 |
|------|----------|------|
| Pfizer 허가 문구 PDF (PHQ-9/GAD-7) | `docs/legal/scales/` | 1순위, 사실상 이거면 끝 |
| PHQ-9/GAD-7 Korean PDF 원본 | 같은 폴더 | 한국어판 검증 논문 PDF도 |
| UMD 사회학과 RSE 안내 PDF | 같은 폴더 | 한국어 번역(전병제) 인용 |
| 한국어판 검증 논문 인용 | 앱 내 정보 화면 + 약관 | 출처 표기 의무 |
| (선택) Kroenke 교수 회신 메일 | `docs/legal/scales/` | 받으면 보너스 |
| (선택) UMD 회신 메일 | `docs/legal/scales/` | 받으면 보너스 |

---

## 4. 한국어 번역본 — 따로 챙겨야 할 것

세 척도 모두 **영문 원본 라이선스가 한국어 번역본에도 적용**되지만, **한국어 검증 논문 자체의 인용**은 별개로 표기해야 합니다.

- **PHQ-9 Korean**: 안제용 외, 「한글판 우울증 선별도구(Patient Health Questionnaire-9, PHQ-9)의 신뢰도와 타당도」, *Anxiety and Mood*, 2013
- **GAD-7 Korean**: Seo, J.-G. & Park, S.-P., 「Validation of the Generalized Anxiety Disorder-7 (GAD-7) and GAD-2 in patients with migraine」, *J Headache Pain*, 2015
- **RSE Korean**: 전병제, 「자아개념 측정 가능성에 관한 연구」, *연세논총*, 1974

이 인용을 앱의 "이 척도에 대해" 안내 화면 + 개인정보/이용약관 끝부분에 함께 표기해두면 라이선스 + 학술 윤리 양쪽이 깔끔하게 처리됩니다.

---

## 요약

**메일 회신을 "받아내는 것"이 목표가 아니라**, Pfizer/UMD가 이미 공개한 허가 문구를 PDF로 박제하는 것이 1순위, 그 위에 안전망으로 메일을 보내는 게 2순위입니다. (A) 단계만 해두면 앱스토어 심사에서도 문제없습니다.

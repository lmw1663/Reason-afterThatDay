# OAuth 설정 가이드 (Google·Apple·Kakao)

> **대상**: A-2 OAuth 로그인 기능 활성화에 필요한 외부 설정.
> **출시 범위**: 🇰🇷 한국 한정.
>
> 코드 구현은 완료됐지만 실제 동작을 위해 아래 외부 설정이 필요해.
> 모든 단계는 **앱 운영자(개발자/사장)가 직접 처리**해야 함.

---

## 0. 사전 패키지 설치

```bash
npx expo install expo-web-browser
```

`expo-web-browser`만 있으면 본 1차 구현(브라우저 기반 OAuth)은 동작.
*native SDK*(Apple Sign-in, Kakao SDK)를 추가하려면 EAS dev build 필요 — 본 문서 §5 참조.

---

## 1. Supabase Auth 설정

### 1-0. Manual Linking (데이터 보존 필수)

본 앱은 첫 진입에 **익명 가입**으로 user.id를 만들고, 이후 OAuth로 *연결*(link)한다.
이렇게 해야 익명 동안 쌓인 일기·응답 데이터가 OAuth 가입 후에도 user.id 동일하게 보존된다.

Supabase Dashboard → **Authentication** → **Settings** → **Manual Linking**: **활성화 필수**.

비활성화 상태면 `linkIdentity` 호출이 실패하고, 사용자가 OAuth 로그인을 누르는 순간 익명 데이터가 고아가 된다.

### 1-1. Provider 등록

Supabase Dashboard → **Authentication** → **Providers**에서 아래 3개 활성화:

#### Google
1. Google Cloud Console에서 OAuth 2.0 Client ID 발급
   - Application type: **Web application**
   - Authorized redirect URIs: `https://<YOUR_PROJECT>.supabase.co/auth/v1/callback`
2. Supabase Provider Google 토글 ON
3. Client ID, Client Secret 입력

#### Apple
1. [Apple Developer](https://developer.apple.com/) → Certificates, IDs & Profiles
2. Identifier 생성 (Services IDs)
   - Identifier: `com.reason.web` (예시)
   - Sign In with Apple 활성화
   - Return URLs: `https://<YOUR_PROJECT>.supabase.co/auth/v1/callback`
3. Key 발급 → JWT 생성 (Supabase 가이드 참조)
4. Supabase Provider Apple 토글 ON
5. Service ID, Team ID, Key ID, Private Key 입력

#### Kakao (한국 메인)
1. [Kakao Developers](https://developers.kakao.com/) → 내 애플리케이션 → 앱 추가
2. **카카오 로그인** 활성화
3. **OpenID Connect** 활성화 (Supabase 호환 위해 필수)
4. Redirect URI: `https://<YOUR_PROJECT>.supabase.co/auth/v1/callback`
5. 동의 항목 설정 — 필수: 닉네임, 카카오계정(이메일)
6. Supabase Provider **Kakao** 토글 ON
   - 만약 Kakao가 표준 provider 목록에 없으면 **Custom OAuth Provider**로 등록
   - Issuer URL: `https://kauth.kakao.com`
   - Client ID: REST API 키
   - Client Secret: 보안 → Client Secret 발급

---

## 2. Deep Link 설정

`app.json`에서 scheme 확인 (이미 `reason`이어야 함):

```json
{
  "expo": {
    "scheme": "reason",
    ...
  }
}
```

OAuth callback URL: `reason://auth/callback`

---

## 3. iOS 추가 설정

### 3-1. Apple Sign-in Capability (EAS build 필수)

`app.json` → `ios` → `entitlements`:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.reason.app",
      "entitlements": {
        "com.apple.developer.applesignin": ["Default"]
      }
    }
  }
}
```

### 3-2. Info.plist URL Schemes (Kakao native SDK 추가 시)

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": ["kakao{NATIVE_APP_KEY}"]
          }
        ],
        "LSApplicationQueriesSchemes": ["kakaokompassauth", "kakaolink"]
      }
    }
  }
}
```

---

## 4. Android 추가 설정

### 4-1. AndroidManifest (Kakao native SDK 추가 시)

`app.json` → `android` → `intentFilters`:

```json
{
  "expo": {
    "android": {
      "package": "com.reason.app",
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [{ "scheme": "kakao{NATIVE_APP_KEY}", "host": "oauth" }],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

### 4-2. Google SHA-1 Fingerprint
Android 빌드 후 SHA-1 → Google Cloud Console에 등록.
EAS build 사용 시 `eas credentials`로 확인.

---

## 5. EAS Dev Build (native SDK 사용 시)

브라우저 OAuth만으로 부족하면 (예: 카카오톡 앱 직접 로그인) native SDK 필요:

```bash
# Native SDK 추가
npx expo install expo-apple-authentication
npm install @react-native-seoul/kakao-login

# EAS dev build
eas build --profile development --platform ios
eas build --profile development --platform android
```

이후 `api/auth.ts`에 native SDK 분기 추가 (현재는 브라우저 flow만).

---

## 6. 동작 테스트

```bash
npx expo start --tunnel
```

1. 첫 진입 → 약관 동의 화면 → 동의
2. 로그인 화면 → Google/Apple/Kakao 중 하나 선택
3. 시스템 브라우저 열림 → 인증
4. `reason://auth/callback?code=...`로 앱 복귀
5. Supabase 세션 생성 + `users.provider`/`provider_user_id` 갱신
6. 기존 이별 날짜 화면으로 이동

---

## 7. 트러블슈팅

| 증상 | 원인·해결 |
|---|---|
| "expo-web-browser 패키지가 필요해" 알림 | `npx expo install expo-web-browser` 실행 |
| "OAuth URL을 받지 못했어" | Supabase Provider 토글 OFF 또는 Client ID 오타 |
| 브라우저 열리지만 callback 안 옴 | app.json scheme이 `reason` 인지 / Supabase redirect URL 정확한지 |
| Apple 로그인 버튼 안 보임 | Android에서는 Apple iOS-only 정책 (의도된 동작) |
| Kakao 로그인 후 "인증 코드를 받지 못했어" | OpenID Connect 미활성화 — Kakao Console에서 ON |
| iOS 시뮬레이터에서 Apple 로그인 실패 | 시뮬레이터 한계 — 실기기 필요 |

---

## 8. 한국 한정 출시 정책

- 본 OAuth 설정은 **한국 사용자**를 전제로 함
- 카카오를 1순위 노출 (`PROVIDERS` 배열 첫 항목)
- 글로벌 출시 시: Naver 추가 검토, 카카오 제외 검토, 다국어 약관 추가

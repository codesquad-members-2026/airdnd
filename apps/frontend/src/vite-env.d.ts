/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_OAUTH_BASE_URL: string;
  readonly VITE_ENABLE_MOCKS: string;
  // 목 모드 초기 로그인 역할 (GUEST | HOST | ADMIN). 미설정 시 비로그인.
  readonly VITE_MOCK_ROLE?: string;
  // Google Maps 브라우저 키와 Map ID
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_GOOGLE_MAPS_MAP_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

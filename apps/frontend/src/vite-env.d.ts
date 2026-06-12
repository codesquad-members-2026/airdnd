/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_OAUTH_BASE_URL: string;
  readonly VITE_ENABLE_MOCKS: string;
  // 목 모드 초기 로그인 역할 (GUEST | HOST | ADMIN). 미설정 시 비로그인.
  readonly VITE_MOCK_ROLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

import type { CreateClientConfig } from './generated/client.gen';

/**
 * hey-api 생성 클라이언트의 런타임 설정.
 * openapi-ts.config.ts의 runtimeConfigPath로 연결되어, 재생성해도 baseUrl이
 * 항상 VITE_API_BASE_URL을 따르도록 유지된다.
 */
export const createClientConfig: CreateClientConfig = config => ({
  ...config,
  baseUrl: import.meta.env.VITE_API_BASE_URL,
});

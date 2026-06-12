export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080',
  oauthBaseUrl: import.meta.env.VITE_OAUTH_BASE_URL || 'http://127.0.0.1:8080',
  enableMocks: import.meta.env.VITE_ENABLE_MOCKS === 'true',
};

export function getGoogleOAuthUrl() {
  return `${env.oauthBaseUrl.replace(/\/$/, '')}/oauth2/authorization/google`;
}

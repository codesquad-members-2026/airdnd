export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080',
  oauthBaseUrl: import.meta.env.VITE_OAUTH_BASE_URL || 'http://127.0.0.1:8080',
  enableMocks: import.meta.env.VITE_ENABLE_MOCKS === 'true',
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '',
  googleMapsMapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID ?? '',
  // PayPal 결제. clientId 가 비어 있으면 결제 버튼 대신 설정 안내를 노출합니다.
  // currency 는 백엔드가 PayPal 주문을 생성할 때 쓰는 통화와 반드시 일치해야 합니다.
  // (PayPal 은 KRW 결제를 지원하지 않으므로 USD 등 지원 통화를 사용합니다.)
  paypalClientId: import.meta.env.VITE_PAYPAL_CLIENT_ID ?? '',
  paypalCurrency: import.meta.env.VITE_PAYPAL_CURRENCY ?? 'USD',
};

export function getGoogleOAuthUrl() {
  return `${env.oauthBaseUrl.replace(/\/$/, '')}/oauth2/authorization/google`;
}

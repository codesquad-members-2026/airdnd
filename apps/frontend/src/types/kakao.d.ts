/** 카카오 우편번호 + 지도 JS SDK 타입 선언 */

interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

interface KakaoMap {
  getCenter(): KakaoLatLng;
  getLevel(): number;
  setLevel(level: number, options?: { animate?: boolean | { duration?: number } }): void;
  setZoomable(zoomable: boolean): void;
}

declare global {
  interface Window {
    kakao: {
      /** 우편번호 서비스 */
      Postcode: new (options: {
        oncomplete: (data: {
          zonecode: string;
          roadAddress: string;
          sido: string;
          sigungu: string;
        }) => void;
      }) => {
        open(): void;
        embed(element: HTMLElement): void;
      };

      /** 지도 서비스 */
      maps: {
        load(callback: () => void): void;
        Map: new (
          container: HTMLElement,
          options: { center: KakaoLatLng; level: number }
        ) => KakaoMap;
        LatLng: new (lat: number, lng: number) => KakaoLatLng;
        Marker: new (options: { map?: KakaoMap; position: KakaoLatLng }) => unknown;
        CustomOverlay: new (options: {
          map?: KakaoMap;
          position: KakaoLatLng;
          content: string | HTMLElement;
          xAnchor?: number;
          yAnchor?: number;
          zIndex?: number;
        }) => unknown;
        event: {
          addListener(target: unknown, type: string, callback: () => void): void;
        };
        services: {
          Geocoder: new () => {
            addressSearch(
              address: string,
              callback: (
                result: Array<{ x: string; y: string }>,
                status: string
              ) => void
            ): void;
          };
          Status: { OK: string };
        };
      };
    };
  }
}

export {};

/** 카카오 우편번호 + 지도 JS SDK 타입 선언 */

declare global {
  interface KakaoLatLng {
    getLat(): number;
    getLng(): number;
  }

  interface KakaoMap {
    getCenter(): KakaoLatLng;
    getLevel(): number;
    setLevel(level: number, options?: { animate?: boolean | { duration?: number } }): void;
    setZoomable(zoomable: boolean): void;
    setCenter(latlng: KakaoLatLng): void;
    panTo(latlng: KakaoLatLng): void;
    setBounds(bounds: KakaoLatLngBounds): void;
    getBounds(): KakaoLatLngBounds;
  }

  interface KakaoLatLngBounds {
    extend(latlng: KakaoLatLng): void;
    getSouthWest(): KakaoLatLng;
    getNorthEast(): KakaoLatLng;
  }

  interface KakaoCustomOverlay {
    setZIndex(zIndex: number): void;
    setMap(map: KakaoMap | null): void;
  }

  interface KakaoCircle {
    setMap(map: KakaoMap | null): void;
  }

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
        LatLngBounds: new () => KakaoLatLngBounds;
        Marker: new (options: { map?: KakaoMap; position: KakaoLatLng }) => unknown;
        CustomOverlay: new (options: {
          map?: KakaoMap;
          position: KakaoLatLng;
          content: string | HTMLElement;
          xAnchor?: number;
          yAnchor?: number;
          zIndex?: number;
        }) => KakaoCustomOverlay;
        Circle: new (options: {
          center: KakaoLatLng;
          radius: number;
          strokeWeight?: number;
          strokeColor?: string;
          strokeOpacity?: number;
          strokeStyle?: string;
          fillColor?: string;
          fillOpacity?: number;
        }) => KakaoCircle;
        event: {
          addListener(target: unknown, type: string, callback: () => void): void;
          removeListener(target: unknown, type: string, callback: () => void): void;
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

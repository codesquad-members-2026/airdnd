import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  // 기본 입력 = 커밋된 스펙 파일(빌드/CD에서 백엔드 부팅 불필요).
  // 라이브 백엔드에서 새로 뽑으려면:
  //   OPENAPI_URL=http://localhost:8080/v3/api-docs npm run generate:api
  //   (또는 curl ... > openapi.json 로 스펙만 갱신 후 npm run generate:api)
  input: process.env.OPENAPI_URL ?? "./openapi.json",
  // format/lint 제거: generated는 gitignore된 빌드 산출물이라 포맷 불필요 +
  // 빌드 단계에서 prettier/eslint 의존을 빼 안정성↑.
  output: {
    path: "src/shared/api/generated",
  },
  plugins: [
    {
      name: "@hey-api/client-fetch",
      runtimeConfigPath: "../hey-api",
    },
    {
      name: "@hey-api/sdk",
      operationId: true,
    },
    "@tanstack/react-query",
  ],
});

import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: process.env.OPENAPI_URL ?? "http://localhost:8080/v3/api-docs",
  output: {
    path: "src/shared/api/generated",
    format: "prettier",
    lint: "eslint",
  },
  plugins: [
    "@hey-api/client-fetch",
    {
      name: "@hey-api/sdk",
      operationId: true,
    },
    "@tanstack/react-query",
  ],
});

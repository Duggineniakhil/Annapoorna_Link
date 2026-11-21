/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_USE_MOCKS?: string;
  readonly VITE_MOCK_AUTO_ADVANCE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** package.json version, set by vite.config.ts. */
declare const __APP_VERSION__: string;

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_BACKBLAZE_ENDPOINT?: string;
  readonly VITE_BACKBLAZE_BUCKET_NAME?: string;
  readonly VITE_BACKBLAZE_PUBLIC_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
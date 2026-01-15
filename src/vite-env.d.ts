/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_KEY: string;
  readonly VITE_SUPABASE_ROOM_IMAGE_BUCKET: string;
  readonly VITE_LIFF_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: {
    readonly VITE_APP_UPLOAD_TOKEN: string;
    // 添加其他环境变量
    [key: string]: string | boolean | undefined;
  };
}
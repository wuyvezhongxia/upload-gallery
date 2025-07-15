import type { PluginOption } from 'vite';
export function compressImage(): PluginOption {
  return {
    name: 'tiny-img-plugin',
    async transform(code, id) {
      // 转换逻辑
    }
  };
}


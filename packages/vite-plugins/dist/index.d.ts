import { Plugin } from 'vite';

interface ClientCompressOptions {
    proxyUrl?: string;
    maxFileSize?: number;
    enableCache?: boolean;
}
declare function compressWithTinyPng(buffer: ArrayBuffer, proxyUrl?: string): Promise<ArrayBuffer>;
declare function compressImageFile(file: File, options?: ClientCompressOptions): Promise<File>;
declare function resetTinyPngStatus(): void;
declare function getTinyPngStatus(): {
    quotaExhausted: boolean;
};
declare function frontendCompressPlugin(options?: any): Plugin;

export { type ClientCompressOptions, compressImageFile, compressWithTinyPng, frontendCompressPlugin, getTinyPngStatus, resetTinyPngStatus };

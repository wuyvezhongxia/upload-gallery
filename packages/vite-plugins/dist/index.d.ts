import { Plugin } from 'vite';

interface FrontendCompressPluginOptions {
    apiKey?: string;
    enableTinyPng?: boolean;
    enableLocalCompress?: boolean;
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
    maxFileSize?: number;
    concurrency?: number;
    enableCache?: boolean;
    autoInject?: boolean;
}
interface ClientCompressOptions {
    apiKey?: string;
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
    maxFileSize?: number;
    enableCache?: boolean;
    preferTinyPng?: boolean;
    fallbackToLocal?: boolean;
}
declare function compressWithTinyPng(buffer: ArrayBuffer, apiKey: string): Promise<ArrayBuffer>;
declare function compressWithCanvas(file: File, options: {
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
}): Promise<File>;
declare function compressImageFile(file: File, options?: ClientCompressOptions): Promise<File>;
declare function resetTinyPngStatus(): void;
declare function getTinyPngStatus(): {
    quotaExhausted: boolean;
};
declare function frontendCompressPlugin(options?: any): Plugin;
declare function uploadCompressPlugin(options: any): Plugin;

export { type ClientCompressOptions, type FrontendCompressPluginOptions, compressImageFile, compressWithCanvas, compressWithTinyPng, frontendCompressPlugin, getTinyPngStatus, resetTinyPngStatus, uploadCompressPlugin };

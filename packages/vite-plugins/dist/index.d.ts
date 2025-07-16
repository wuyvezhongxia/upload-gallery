import { Plugin } from 'vite';

interface TinyPngPluginOptions {
    apiKey: string;
    include?: RegExp | string[];
    exclude?: RegExp | string[];
    cacheDir?: string;
    cache?: boolean;
    inlineThreshold?: number;
    concurrency?: number;
}
declare class TinyPngCompressor {
    private cachePath;
    private apiKey;
    private enableCache;
    constructor(apiKey: string, cacheDir?: string, enableCache?: boolean);
    compressImage(file: Buffer, originalPath?: string): Promise<Buffer>;
}
declare function tinyPngPlugin(options: TinyPngPluginOptions): Plugin;

interface UploadCompressPluginOptions {
    apiKey: string;
    uploadPaths?: string[];
    concurrency?: number;
    enableCache?: boolean;
    quality?: number;
    maxFileSize?: number;
    fallbackToLocal?: boolean;
}
declare function uploadCompressPlugin(options: UploadCompressPluginOptions): Plugin;

export { TinyPngCompressor, type UploadCompressPluginOptions, tinyPngPlugin, uploadCompressPlugin };

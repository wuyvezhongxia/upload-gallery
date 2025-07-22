import * as _reduxjs_toolkit from '@reduxjs/toolkit';

interface ImageItem {
    id: number;
    url: string;
    name: string;
    date: number;
    size: number;
    originSize?: number;
}
type ImageState = {
    imgList: ImageItem[];
};
declare const addImage: _reduxjs_toolkit.ActionCreatorWithPayload<any, "imageStore/addImage">;
declare const cleanExpiredImages: _reduxjs_toolkit.ActionCreatorWithoutPayload<"imageStore/cleanExpiredImages">;
declare const refreshImages: _reduxjs_toolkit.ActionCreatorWithoutPayload<"imageStore/refreshImages">;
declare const _default$1: _reduxjs_toolkit.Reducer<{
    imgList: ImageItem[];
}>;

interface BaseConfig {
    token: string;
    scope: string;
    prefix: string;
    domain: string;
    date: number;
    compressImage?: any;
    config?: Record<string, any>;
}
interface QiNiuConfig extends BaseConfig {
    config: {
        useCdnDomain: boolean;
    };
}
type ConfigState = {
    qiniu: QiNiuConfig;
    parsedToken: any;
    warningTimer: any;
};
declare const parseToken: _reduxjs_toolkit.ActionCreatorWithPayload<any, "config/parseToken">;
declare const _default: _reduxjs_toolkit.Reducer<{
    qiniu: any;
    parsedToken: any;
    warningTimer: any;
}>;

export { type ConfigState, type ImageItem, type ImageState, type QiNiuConfig, addImage, cleanExpiredImages, _default as configReducer, _default$1 as imageReducer, parseToken, refreshImages };

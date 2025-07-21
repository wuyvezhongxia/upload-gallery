import { useState, useEffect, useRef } from "react";
import { message } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import { addImage } from "@yuanjing/shared";
import { uploadFile } from "@/utils/qiniu";

import { compressImage } from "@/utils/image";
import { copyUrl,copyMd } from "@/utils/stringUtil";
import type { RootState } from "@/store/index";
import type { ConfigState } from "@yuanjing/shared";
import {
  calculateCompressionPercentage,
  formatSize,
} from "@/utils/transform";
import type { UploadableFile } from "@/types/upload";

export const useFileUpload = (config: any) => {
  const dispatch = useDispatch();
  const { qiniu } = useSelector((state: RootState) => (state.config as ConfigState));
  const [fileList, setFileList] = useState<UploadableFile[]>([]);
  const uploadingFiles = useRef(new Set<string>());

  // 上传队列处理逻辑
  useEffect(() => {
    const uploadQueue = fileList.filter(
      (file) => file.status === "ready" && !uploadingFiles.current.has(file.uid)
    );
    if (uploadQueue.length === 0) return;

    const upload = async (file: UploadableFile) => {
      uploadingFiles.current.add(file.uid);

      setFileList((prev) =>
        prev.map((f) =>
          f.uid === file.uid ? { ...f, status: "uploading", percent: 0 } : f
        )
      );

      try {
        const url = await uploadFile(file.raw, qiniu, {
          process: (percent) => {
            setFileList((prev) =>
              prev.map((f) => (f.uid === file.uid ? { ...f, percent } : f))
            );
          },
        });

        if (url) {
          message.success(`${file.name}上传成功`);
        }

        if (config.autoCopy) {
          if (config.copyType === "Markdown") {
            await copyMd(url, file.name);
          } else {
            await copyUrl(url);
          }
        }

        dispatch(
          addImage({
            id: uuidv4(),
            url,
            name: file.name || "image",
            size: file.raw.size,
            originSize: file.originalSize || file.raw.size,
            date: Date.now(),
          })
        );

        setFileList((prev) =>
          prev.map((f) =>
            f.uid === file.uid ? { ...f, status: "success", percent: 100 } : f
          )
        );

        setTimeout(() => {
          setFileList((prev) => prev.filter((f) => f.uid !== file.uid));
          uploadingFiles.current.delete(file.uid);
        }, 3000);
      } catch (error) {
        message.error(`${file.name} 上传失败: ${error}`);
        setFileList((prev) =>
          prev.map((f) => (f.uid === file.uid ? { ...f, status: "error" } : f))
        );
        uploadingFiles.current.delete(file.uid);
      }
    };

    uploadQueue.forEach(upload);
  }, [fileList, config, dispatch, qiniu]);

  // 添加文件到队列
  const addFileToQueue = async (file: File, isExpired: boolean) => {
    if (isExpired) {
      message.error("七牛云Token已过期, 请重新配置");
      return;
    }

    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("只能上传图片");
      return false;
    }

    const originalSize = file.size;
    let processedFile: File = file;
    const tempUid = `${Date.now()}-${Math.random()}`;

    if (config.compressImage) {
      setFileList((prev) => [
        ...prev,
        {
          uid: tempUid,
          raw: file,
          name: file.name,
          status: "compressing",
          percent: 0,
          originalSize: originalSize,
          compressInfo: "准备压缩...",
        },
      ]);

      try {
        processedFile = await compressImage(file, {
          quality: 80,
          width: 1200,
          noCompressIfLarger: true,
          useTinyPng: true,
          onProgress: (percent, info) => {
            setFileList((prev) =>
              prev.map((f) =>
                f.uid === tempUid
                  ? {
                      ...f,
                      percent: Math.round(percent),
                      compressInfo: info || "压缩中...",
                    }
                  : f
              )
            );
          },
        });

        const compressionRate = calculateCompressionPercentage(
          originalSize,
          processedFile.size
        );
        const originalSizeStr = formatSize(originalSize);
        const compressedSizeStr = formatSize(processedFile.size);

        setFileList((prev) =>
          prev.map((f) =>
            f.uid === tempUid
              ? {
                  ...f,
                  raw: processedFile,
                  status: "ready",
                  percent: 0,
                  compressionRate: `${compressionRate}%`,
                  compressInfo: `${originalSizeStr} → ${compressedSizeStr} (压缩率: ${compressionRate}%)`,
                }
              : f
          )
        );
      } catch (error: any) {
        console.error("压缩过程出错,改用本地压缩", error);

        setFileList((prev) =>
          prev.map((f) =>
            f.uid === tempUid
              ? {
                  ...f,
                  status: "ready",
                  percent: 0,
                  compressInfo: "压缩失败，使用原文件",
                }
              : f
          )
        );

        message.warning("压缩失败，使用原文件上传");
      }
    } else {
      setFileList((prev) => [
        ...prev,
        {
          uid: tempUid,
          raw: processedFile,
          name: processedFile.name,
          status: "ready",
          percent: 0,
          originalSize: originalSize,
        },
      ]);
    }

    return false;
  };

  return {
    fileList,
    addFileToQueue,
  };
};

import { useEffect, useRef } from "react";
import { message } from "antd";

export const usePasteHandler = (
  isExpired: boolean,
  addFileToQueue: (
    file: File,
    isExpired: boolean
  ) => Promise<boolean | undefined>,
  config: any
) => {
  const pasteAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isExpired) {
      message.error("七牛云Token已过期, 请重新配置");
      return;
    }

    const handlePaste = async (e: ClipboardEvent) => {
      e.preventDefault();
      const items = e.clipboardData?.items;
      if (!items) return;

      let hasImage = false;

      for (const item of Array.from(items)) {
        if (item.kind === "file" && item.type.startsWith("image")) {
          const file = item.getAsFile();
          if (file) {
            hasImage = true;
            const namedFile = new File(
              [file],
              file.name || `pasted-image-${Date.now()}`,
              {
                type: file.type,
              }
            );
            await addFileToQueue(namedFile, isExpired);
          }
        }
      }

      if (!hasImage) {
        message.error("剪贴板中没有图片");
      }
    };

    const el = pasteAreaRef.current;
    if (el) {
      el.addEventListener("paste", handlePaste);
    }
    return () => {
      if (el) {
        el.removeEventListener("paste", handlePaste);
      }
    };
  }, [isExpired, addFileToQueue, config.compressImage]);

  return { pasteAreaRef };
};

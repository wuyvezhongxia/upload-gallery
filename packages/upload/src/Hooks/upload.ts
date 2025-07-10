import { useState, useEffect } from "react";

interface UploadConfig {
  autoCopy: boolean;
  copyType: "Markdown" | "链接";
  pageSize: number;
  compressImage: boolean;
  compressPreview: boolean;
}

const defaultUploadConfig: UploadConfig = {
  autoCopy: true,
  copyType: "Markdown",
  pageSize: 20,
  compressImage: true,
  compressPreview: true,
};

export function useUploadConfig() {
  const [config, setConfig] = useState<UploadConfig>(defaultUploadConfig);
  
  useEffect(() => {
    try {
      const saved = localStorage.getItem("uploadConfig");
      if (saved) {
        const parsedConfig = JSON.parse(saved);
        setConfig({ ...defaultUploadConfig, ...parsedConfig });
      }
    } catch (error) {
      console.error("Failed to load upload config:", error);
    }
  }, []);

  const updateConfig = (newConfig: Partial<UploadConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    localStorage.setItem("uploadConfig", JSON.stringify(updatedConfig));
  };

  return {
    config,
    updateConfig
  };
}

const defaultUploadConfig = {
  autoCopy: true,
  copyType: "markdown",
  pageSize: 20,
  compressImage: true,
  compressPreview: true,
};

export function useUploadConfig() {
  const cacheConfig = useLocalStorage("uploadConfig", defaultUploadConfig);
  return cacheConfig;
}

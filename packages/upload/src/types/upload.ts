export interface UploadableFile {
  uid: string;
  raw: File;
  name: string;
  status: "ready" | "compressing" | "uploading" | "success" | "error";
  percent?: number;
  originalSize?: number;
  compressInfo?: string;
  compressionRate?: string;
}

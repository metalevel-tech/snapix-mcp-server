export interface SnapixClientConfig {
  baseUrl: string;
  apiKey: string;
}

export type TransportType = "stdio" | "http";

export type CreateServerOptions = Omit<SnapixClientConfig, "baseUrl"> & {
  baseUrl?: string;
  transport?: TransportType;
};

export interface ListImagesParams {
  page?: number;
  limit?: number;
  sort?: "asc" | "desc";
  bucketKey?: string;
}

export interface ImageSourceParams {
  imageUrl?: string;
  imageBase64?: string;
  imageFilePath?: string;
  imageContentType?: string;
  contentType?: string;
  name?: string;
  description?: string;
  ratio?: number;
  resizeOptions?: Record<string, unknown>[];
  formatOptions?: { format: string; options?: Record<string, unknown> }[];
  galleries?: string[];
  bucketKey?: string;
}

export interface UploadImageParams extends ImageSourceParams {
  prefix?: string;
  storageKeyHandling?: "unique" | "default";
}

export interface GenerateImageParams extends ImageSourceParams {
  promptText: string;
  aiConfig?: Record<string, unknown>;
}

export interface UpdateImageParams {
  name?: string;
  description?: string;
  galleries?: string[];
  formatOptions?: { format: string; options?: Record<string, unknown> };
  resizeOptions?: Record<string, unknown>;
}

export interface CreateGalleryParams {
  name: string;
  isPublic?: boolean;
  bucketKey?: string;
  imageIds?: string[];
}

export interface UpdateGalleryParams {
  name?: string;
  isPublic?: boolean;
}

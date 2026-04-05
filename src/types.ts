export interface SnapixClientConfig {
  baseUrl: string;
  apiKey: string;
}

export type CreateServerOptions = Omit<SnapixClientConfig, "baseUrl"> & {
  baseUrl?: string;
};

export interface ListImagesParams {
  page?: number;
  limit?: number;
  sort?: "asc" | "desc";
  bucketKey?: string;
}

export interface UploadImageParams {
  imageUrl?: string;
  imageBase64?: string;
  imageContentType?: string;
  name?: string;
  description?: string;
  contentType?: string;
  ratio?: number;
  resizeOptions?: Record<string, unknown>[];
  formatOptions?: { format: string; options?: Record<string, unknown> }[];
  galleries?: string[];
  bucketKey?: string;
  prefix?: string;
  storageKeyHandling?: "unique" | "default";
}

export interface GenerateImageParams {
  promptText: string;
  imageUrl?: string;
  name?: string;
  description?: string;
  ratio?: number;
  resizeOptions?: Record<string, unknown>[];
  formatOptions?: { format: string; options?: Record<string, unknown> }[];
  galleries?: string[];
  bucketKey?: string;
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

import { API_URI_GALLERIES, API_URI_GENERATE, API_URI_IMAGES } from "./constants.js";
import { SnapixApiError } from "./errors.js";
import {
  type CreateGalleryParams,
  type GenerateImageParams,
  type ImageSourceParams,
  type ListImagesParams,
  type SnapixClientConfig,
  type UpdateGalleryParams,
  type UpdateImageParams,
  type UploadImageParams,
} from "./types.js";

import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";

export class SnapixClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: SnapixClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.apiKey = config.apiKey;
  }

  private get headers(): Record<string, string> {
    return { Authorization: `Bearer ${this.apiKey}` };
  }

  private async handleResponse(response: Response): Promise<unknown> {
    if (!response.ok) {
      let body: unknown;

      try {
        body = await response.json();
      } catch {
        body = await response.text().catch(() => undefined);
      }

      const message =
        body && typeof body === "object" && "error" in body
          ? String((body as { error: string }).error)
          : body && typeof body === "object" && "message" in body
            ? String((body as { message: string }).message)
            : `HTTP ${response.status}: ${response.statusText}`;

      throw new SnapixApiError(message, response.status, body);
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      return response.json();
    }

    return response.text();
  }

  private buildFormData(params: Record<string, unknown>): FormData {
    const formData = new FormData();

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) {
        continue;
      }

      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        formData.append(key, String(value));
      } else {
        formData.append(key, JSON.stringify(value));
      }
    }

    return formData;
  }

  /**
   * Image endpoints
   */

  private async handleImageUploadParams(
    params: ImageSourceParams,
    formData: FormData
  ): Promise<FormData> {
    if (params.imageFilePath) {
      const buffer = await readFile(params.imageFilePath);
      const ext = extname(params.imageFilePath).slice(1).toLowerCase();
      const mimeMap: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        webp: "image/webp",
        avif: "image/avif",
        gif: "image/gif",
        svg: "image/svg+xml",
      };
      const mimeType =
        params.imageContentType ?? params.contentType ?? mimeMap[ext] ?? "application/octet-stream";
      const blob = new Blob([buffer], { type: mimeType });
      const filename = params.name
        ? `${params.name}.${ext || "bin"}`
        : basename(params.imageFilePath);
      formData.append("image", blob, filename);
    } else if (params.imageBase64) {
      const mimeType = params.imageContentType ?? params.contentType ?? "application/octet-stream";
      const buffer = Buffer.from(params.imageBase64, "base64");
      const blob = new Blob([buffer], { type: mimeType });
      const ext = mimeType.split("/")[1] ?? "bin";
      const filename = params.name ? `${params.name}.${ext}` : `upload.${ext}`;
      formData.append("image", blob, filename);
    } else if (params.imageUrl) {
      formData.append("url", params.imageUrl);
    }

    return formData;
  }

  async uploadImage(params: UploadImageParams): Promise<unknown> {
    const formData = this.buildFormData({
      name: params.name,
      description: params.description,
      contentType: params.contentType ?? params.imageContentType,
      ratio: params.ratio !== undefined ? JSON.stringify(params.ratio) : undefined,
      resizeOptions:
        params.resizeOptions !== undefined ? JSON.stringify(params.resizeOptions) : undefined,
      formatOptions:
        params.formatOptions !== undefined ? JSON.stringify(params.formatOptions) : undefined,
      galleries: params.galleries !== undefined ? JSON.stringify(params.galleries) : undefined,
      bucketKey: params.bucketKey,
      prefix: params.prefix,
      storageKeyHandling: params.storageKeyHandling,
    });

    await this.handleImageUploadParams(params, formData);

    const response = await fetch(`${this.baseUrl}/${API_URI_IMAGES}`, {
      method: "POST",
      headers: this.headers,
      body: formData,
    });

    return this.handleResponse(response);
  }

  async listImages(params?: ListImagesParams): Promise<unknown> {
    const searchParams = new URLSearchParams();

    if (params?.page !== undefined) {
      searchParams.set("page", String(params.page));
    }
    if (params?.limit !== undefined) {
      searchParams.set("limit", String(params.limit));
    }
    if (params?.sort) {
      searchParams.set("sort", params.sort);
    }
    if (params?.bucketKey) {
      searchParams.set("bucketKey", params.bucketKey);
    }

    const query = searchParams.toString();
    const url = `${this.baseUrl}/${API_URI_IMAGES}${query ? `?${query}` : ""}`;

    const response = await fetch(url, { method: "GET", headers: this.headers });

    return this.handleResponse(response);
  }

  async getImage(imageId: string): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/${API_URI_IMAGES}/${imageId}`, {
      method: "GET",
      headers: this.headers,
    });

    return this.handleResponse(response);
  }

  async updateImage(imageId: string, params: UpdateImageParams): Promise<unknown> {
    const formData = this.buildFormData({
      name: params.name,
      description: params.description,
      galleries: params.galleries !== undefined ? JSON.stringify(params.galleries) : undefined,
      formatOptions:
        params.formatOptions !== undefined ? JSON.stringify(params.formatOptions) : undefined,
      resizeOptions:
        params.resizeOptions !== undefined ? JSON.stringify(params.resizeOptions) : undefined,
    });

    const response = await fetch(`${this.baseUrl}/${API_URI_IMAGES}/${imageId}`, {
      method: "PATCH",
      headers: this.headers,
      body: formData,
    });

    return this.handleResponse(response);
  }

  async deleteImage(imageId: string): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/${API_URI_IMAGES}/${imageId}`, {
      method: "DELETE",
      headers: this.headers,
    });

    if (response.status === 204) {
      return { success: true };
    }

    return this.handleResponse(response);
  }

  /**
   * Generate endpoint
   */

  async generateImage(params: GenerateImageParams): Promise<unknown> {
    const formData = this.buildFormData({
      prompt: params.promptText,
      name: params.name,
      description: params.description,
      ratio: params.ratio !== undefined ? JSON.stringify(params.ratio) : undefined,
      resizeOptions:
        params.resizeOptions !== undefined ? JSON.stringify(params.resizeOptions) : undefined,
      formatOptions:
        params.formatOptions !== undefined ? JSON.stringify(params.formatOptions) : undefined,
      galleries: params.galleries !== undefined ? JSON.stringify(params.galleries) : undefined,
      bucketKey: params.bucketKey,
      aiConfig: params.aiConfig !== undefined ? JSON.stringify(params.aiConfig) : undefined,
    });

    await this.handleImageUploadParams(params, formData);

    const response = await fetch(`${this.baseUrl}/${API_URI_GENERATE}`, {
      method: "POST",
      headers: this.headers,
      body: formData,
    });

    return this.handleResponse(response);
  }

  /**
   * Gallery endpoints
   */

  async createGallery(params: CreateGalleryParams): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/${API_URI_GALLERIES}`, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    return this.handleResponse(response);
  }

  async listGalleries(): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/${API_URI_GALLERIES}`, {
      method: "GET",
      headers: this.headers,
    });

    return this.handleResponse(response);
  }

  async getGallery(galleryId: string): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/${API_URI_GALLERIES}/${galleryId}`, {
      method: "GET",
      headers: this.headers,
    });

    return this.handleResponse(response);
  }

  async updateGallery(galleryId: string, params: UpdateGalleryParams): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/${API_URI_GALLERIES}/${galleryId}`, {
      method: "PATCH",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    return this.handleResponse(response);
  }

  async deleteGallery(galleryId: string, deleteImages?: boolean): Promise<unknown> {
    const query = deleteImages ? "?deleteImages=true" : "";

    const response = await fetch(`${this.baseUrl}/${API_URI_GALLERIES}/${galleryId}${query}`, {
      method: "DELETE",
      headers: this.headers,
    });

    if (response.status === 204) {
      return { success: true };
    }

    return this.handleResponse(response);
  }
}

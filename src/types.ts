import { type LogLevel } from "@metalevel/snapix-sdk-core";

export type { LogLevel };

export type TransportType = "stdio" | "http";

export interface CreateServerOptions {
  apiKey: string;
  baseUrl?: string;
  bucketKey?: string;
  logLevel?: LogLevel;
  transport?: TransportType;
}

import type { AppSettings, ConnectionTestResult } from '../../../shared/contracts';

export interface ProviderGenerateRequest {
  system: string;
  user: string;
  signal?: AbortSignal;
}

export interface AIProvider {
  readonly requiresApiKey: boolean;
  testConnection(): Promise<ConnectionTestResult>;
  generate(request: ProviderGenerateRequest): Promise<string>;
}

export interface ProviderOptions {
  settings: AppSettings['ai'];
  apiKey?: string;
}

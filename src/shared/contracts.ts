export type SupportedExtension = '.md' | '.txt';
export type ThemeMode = 'system' | 'light' | 'dark';
export type AIStage = 'organize' | 'structure' | 'validate' | 'realize' | 'prompt';

export interface FileSummary {
  relativePath: string;
  name: string;
  extension: SupportedExtension;
  modifiedAt: number;
  size: number;
}

export interface FileDocument extends FileSummary {
  content: string;
}

export interface CreateFileInput {
  name?: string;
  extension?: SupportedExtension;
  content?: string;
}

export interface WriteFileInput {
  relativePath: string;
  content: string;
  expectedModifiedAt?: number;
}

export type SaveResult =
  { status: 'saved'; modifiedAt: number } | { status: 'conflict'; modifiedAt: number };

export interface AppSettings {
  workspacePath: string | null;
  recentWorkspaces: string[];
  lastDocument: string | null;
  reopenLastDocument: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
  theme: ThemeMode;
  fontSize: number;
  ai: {
    providerName: string;
    baseUrl: string;
    model: string;
    timeoutMs: number;
    hasApiKey: boolean;
  };
}

export type SettingsPatch = Partial<
  Omit<AppSettings, 'ai' | 'recentWorkspaces' | 'workspacePath'>
> & {
  ai?: Partial<Omit<AppSettings['ai'], 'hasApiKey'>>;
};

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
}

export interface AnalyzeRequest {
  requestId: string;
  stage: AIStage;
  content: string;
  instructions?: string;
}

export interface AssistantResult {
  stage: AIStage;
  title: string;
  summary: string;
  sections: Array<{
    id: string;
    title: string;
    items: Array<{
      id: string;
      label: string;
      content: string;
      evidenceStatus:
        'user-stated' | 'ai-organized' | 'ai-inferred' | 'needs-verification';
    }>;
  }>;
  questions: Array<{
    id: string;
    question: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  nextActions: string[];
  finalPrompt?: string;
  rawText: string;
  createdAt: string;
}

export interface AppInfo {
  version: string;
  platform: string;
}

export interface ThinkFrameAPI {
  window: {
    minimize(): Promise<void>;
    toggleMaximize(): Promise<void>;
    close(): Promise<void>;
  };
  app: {
    getInfo(): Promise<AppInfo>;
  };
  workspace: {
    select(): Promise<string | null>;
    listFiles(): Promise<FileSummary[]>;
  };
  files: {
    read(relativePath: string): Promise<FileDocument>;
    write(input: WriteFileInput): Promise<SaveResult>;
    create(input: CreateFileInput): Promise<FileDocument>;
    rename(oldPath: string, newPath: string): Promise<FileDocument>;
    duplicate(relativePath: string): Promise<FileDocument>;
    remove(relativePath: string): Promise<void>;
    reveal(relativePath: string): Promise<void>;
  };
  settings: {
    get(): Promise<AppSettings>;
    update(patch: SettingsPatch): Promise<AppSettings>;
    saveApiKey(apiKey: string): Promise<void>;
    deleteApiKey(): Promise<void>;
    testAIConnection(): Promise<ConnectionTestResult>;
  };
  ai: {
    analyze(request: AnalyzeRequest): Promise<AssistantResult>;
    cancel(requestId: string): Promise<void>;
  };
  external: {
    copyAndOpen(
      urlKey: 'chatgpt' | 'claude' | 'gemini' | 'grok',
      text: string,
    ): Promise<void>;
    copy(text: string): Promise<void>;
  };
}

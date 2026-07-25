export const AI_PROVIDER_IDS = [
  'chatgpt',
  'claude',
  'gemini',
  'grok',
  'metaai',
  'openrouter',
  'ollama',
  'qwen',
  'moonshot',
  'deepseek',
  'doubao',
  'custom',
] as const;

export type AIProviderId = (typeof AI_PROVIDER_IDS)[number];

export type AIProviderMode =
  | 'openai'
  | 'anthropic'
  | 'gemini-openai'
  | 'ollama';

export interface AIProviderDescriptor {
  id: AIProviderId;
  name: string;
  mode: AIProviderMode;
  website: string;
  baseUrl: string;
  model: string;
  requiresApiKey: boolean;
}

export const AI_PROVIDER_CATALOG: AIProviderDescriptor[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    mode: 'openai',
    website: 'https://chatgpt.com/',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4.1-mini',
    requiresApiKey: true,
  },
  {
    id: 'claude',
    name: 'Claude',
    mode: 'anthropic',
    website: 'https://claude.ai/new',
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-3-5-sonnet-20241022',
    requiresApiKey: true,
  },
  {
    id: 'gemini',
    name: 'Gemini',
    mode: 'gemini-openai',
    website: 'https://gemini.google.com/app',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.0-flash',
    requiresApiKey: true,
  },
  {
    id: 'grok',
    name: 'Grok',
    mode: 'openai',
    website: 'https://grok.com/',
    baseUrl: 'https://api.x.ai/v1',
    model: 'grok-2-1212',
    requiresApiKey: true,
  },
  {
    id: 'metaai',
    name: 'Meta AI',
    mode: 'openai',
    website: 'https://www.meta.ai/',
    baseUrl: 'https://api.meta.ai/v1',
    model: 'meta-llama/Meta-Llama-3-70B-Instruct',
    requiresApiKey: true,
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    mode: 'openai',
    website: 'https://openrouter.ai/',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'openai/gpt-4.1-mini',
    requiresApiKey: true,
  },
  {
    id: 'ollama',
    name: 'Ollama',
    mode: 'ollama',
    website: 'http://127.0.0.1:11434',
    baseUrl: 'http://127.0.0.1:11434',
    model: 'llama3.1',
    requiresApiKey: false,
  },
  {
    id: 'qwen',
    name: 'Qwen',
    mode: 'openai',
    website: 'https://chat.qwen.ai/',
    baseUrl: 'https://api.qwen.ai/v1',
    model: 'qwen2.5-72b-instruct',
    requiresApiKey: true,
  },
  {
    id: 'moonshot',
    name: 'Moonshot',
    mode: 'openai',
    website: 'https://www.moonshot.cn/',
    baseUrl: 'https://api.moonshot.ai/v1',
    model: 'moonshot-v1-128k',
    requiresApiKey: true,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    mode: 'openai',
    website: 'https://chat.deepseek.com/',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    requiresApiKey: true,
  },
  {
    id: 'doubao',
    name: '豆包',
    mode: 'openai',
    website: 'https://www.doubao.com/chat',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    model: 'doubao-pro-32k',
    requiresApiKey: true,
  },
  {
    id: 'custom',
    name: '사용자 지정',
    mode: 'openai',
    website: '',
    baseUrl: 'https://api.example.com/v1',
    model: 'gpt-4.1-mini',
    requiresApiKey: true,
  },
];

export const AI_PROVIDER_MAP = Object.fromEntries(
  AI_PROVIDER_CATALOG.map((provider) => [provider.id, provider]),
) as Record<AIProviderId, AIProviderDescriptor>;

export const AI_WEB_PROVIDERS = AI_PROVIDER_CATALOG.filter(
  (provider) => provider.website.length > 0,
);

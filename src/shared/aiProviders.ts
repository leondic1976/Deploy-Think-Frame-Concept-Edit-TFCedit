export const AI_PROVIDER_IDS = [
  'chatgpt',
  'claude',
  'gemini',
  'grok',
  'metaai',
  'groq',
  'openrouter-free',
  'openrouter',
  'ollama',
  'qwen',
  'moonshot',
  'deepseek',
  'doubao',
  'custom',
] as const;

export type AIProviderId = (typeof AI_PROVIDER_IDS)[number];

export type AIProviderMode = 'openai' | 'anthropic' | 'gemini-openai' | 'ollama';

export interface AIProviderDescriptor {
  id: AIProviderId;
  name: string;
  mode: AIProviderMode;
  website: string;
  baseUrl: string;
  model: string;
  requiresApiKey: boolean;
  freeTier?: string;
  setupUrl?: string;
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
    name: 'Gemini 무료 등급',
    mode: 'gemini-openai',
    website: 'https://gemini.google.com/app',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    model: 'gemini-2.5-flash-lite',
    requiresApiKey: true,
    freeTier: 'Google AI Studio 키로 무료 한도 내에서 사용할 수 있습니다.',
    setupUrl: 'https://aistudio.google.com/apikey',
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
    id: 'groq',
    name: 'Groq 무료 플랜',
    mode: 'openai',
    website: 'https://console.groq.com/',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'openai/gpt-oss-20b',
    requiresApiKey: true,
    freeTier: '무료 개발자 한도 내에서 빠른 추론을 사용할 수 있습니다.',
    setupUrl: 'https://console.groq.com/keys',
  },
  {
    id: 'openrouter-free',
    name: 'OpenRouter 무료 모델',
    mode: 'openai',
    website: 'https://openrouter.ai/',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'openrouter/free',
    requiresApiKey: true,
    freeTier: '무료 라우터가 현재 사용 가능한 무료 모델을 자동으로 선택합니다.',
    setupUrl: 'https://openrouter.ai/settings/keys',
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
    name: 'Ollama 로컬 무료',
    mode: 'ollama',
    website: 'http://127.0.0.1:11434',
    baseUrl: 'http://127.0.0.1:11434',
    model: 'llama3.1',
    requiresApiKey: false,
    freeTier: '내 컴퓨터에서 실행하며 API 사용료와 API 키가 필요 없습니다.',
    setupUrl: 'https://ollama.com/download',
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

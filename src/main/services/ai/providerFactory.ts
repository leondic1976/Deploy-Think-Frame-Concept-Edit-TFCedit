import type { AIProviderId } from '../../../shared/aiProviders';
import type { AIProvider, ProviderOptions } from './AIProvider';
import { AnthropicProvider } from './AnthropicProvider';
import { GeminiProvider } from './GeminiProvider';
import { OpenAICompatibleProvider } from './OpenAICompatibleProvider';
import { OllamaProvider } from './OllamaProvider';

export function createProvider(
  providerId: AIProviderId,
  options: ProviderOptions,
): AIProvider {
  switch (providerId) {
    case 'claude':
      return new AnthropicProvider(options);
    case 'gemini':
      return new GeminiProvider(options);
    case 'ollama':
      return new OllamaProvider(options);
    case 'chatgpt':
    case 'grok':
    case 'metaai':
    case 'groq':
    case 'openrouter-free':
    case 'openrouter':
    case 'qwen':
    case 'moonshot':
    case 'deepseek':
    case 'doubao':
    case 'custom':
      return new OpenAICompatibleProvider(options);
    default:
      return new OpenAICompatibleProvider(options);
  }
}

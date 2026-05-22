import OpenAI from 'openai';
import type { AIProviderConfig } from './types';
import type { FoodAnalysisResult, MultiFoodAnalysisResult, NutritionLabelResult, ChatMessage, UserProfile, FoodEntry } from '../../types';
import { FOOD_ANALYSIS_SYSTEM_PROMPT } from './prompts/foodAnalysis';
import { NUTRITION_LABEL_SYSTEM_PROMPT } from './prompts/nutritionLabel';
import { DEEPSEEK_OCR_USER_PROMPT, parseDeepSeekOCRResponse } from './prompts/nutritionLabelDeepSeek';
import { TEXT_FOOD_ANALYSIS_SYSTEM_PROMPT } from './prompts/textFoodAnalysis';
import { buildCoachSystemPrompt } from './prompts/coach';
import { 
  validateMultiFoodAnalysisResult, 
  validateNutritionLabelResult,
  safeJsonParse 
} from '../../utils/validation';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000];

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const status = (error as { status?: number; statusCode?: number })?.status || 
                     (error as { status?: number; statusCode?: number })?.statusCode;
      if (status === 429 || status === 503) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[i]));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

function formatAIError(error: unknown): string {
  const err = error as { 
    status?: number; 
    statusCode?: number; 
    response?: { status?: number; data?: { error?: { message?: string } }; text?: string };
    message?: string;
  };
  const status = err?.status || err?.statusCode || err?.response?.status;
  const message = err?.message || err?.response?.data?.error?.message || err?.response?.text || '未知错误';
  
  if (status === 400) {
    return `请求格式错误: ${message}`;
  } else if (status === 401) {
    return 'API Key 无效或未设置';
  } else if (status === 402) {
    return '余额不足，请充值';
  } else if (status === 429) {
    return '请求过于频繁，请稍后重试';
  } else if (status && status >= 500) {
    return '服务器内部错误，请稍后重试';
  }
  
  return `识别失败 (${status || '无状态码'}): ${message}`;
}

export class AIClient {
  private client: OpenAI;
  private config: AIProviderConfig;

  constructor(config: AIProviderConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      dangerouslyAllowBrowser: true,
      defaultHeaders: config.headers,
    });
  }

  async analyzeFood(imageBase64: string, textDescription?: string): Promise<MultiFoodAnalysisResult> {
    return withRetry(async () => {
      const userContent: Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }> = [
        {
          type: 'image_url',
          image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
        },
      ];
      if (textDescription) {
        userContent.unshift({ type: 'text', text: textDescription });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: any = {
        model: this.config.models.vision,
        messages: [
          { role: 'system', content: FOOD_ANALYSIS_SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
        max_tokens: 2048,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      };

      const response = await this.client.chat.completions.create(params);
      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from AI');
      
      // 使用安全解析和验证
      const parsed = safeJsonParse(content);
      return validateMultiFoodAnalysisResult(parsed);
    });
  }

  async analyzeNutritionLabel(imageBase64: string): Promise<NutritionLabelResult> {
    try {
      return await withRetry(async () => {
        const isDeepSeekOCR = this.config.models.ocr.toLowerCase().includes('deepseek') &&
                               this.config.models.ocr.toLowerCase().includes('ocr');

        let response;
        if (isDeepSeekOCR) {
          response = await this.client.chat.completions.create({
            model: this.config.models.ocr,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
                  },
                  {
                    type: 'text',
                    text: DEEPSEEK_OCR_USER_PROMPT,
                  },
                ],
              },
            ],
            max_tokens: 4096,
            temperature: 0.05,
          });
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const params: any = {
            model: this.config.models.ocr,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'image_url',
                    image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
                  },
                  {
                    type: 'text',
                    text: NUTRITION_LABEL_SYSTEM_PROMPT,
                  },
                ],
              },
            ],
            max_tokens: 4096,
            temperature: 0.05,
          };

          try {
            params.response_format = { type: 'json_object' };
            response = await this.client.chat.completions.create(params);
          } catch {
            delete params.response_format;
            response = await this.client.chat.completions.create(params);
          }
        }

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error('Empty response from AI');

        let parsed: unknown;
        if (isDeepSeekOCR) {
          parsed = parseDeepSeekOCRResponse(content);
        } else {
          parsed = safeJsonParse(content);
          if (!parsed || typeof parsed !== 'object') {
            parsed = parseDeepSeekOCRResponse(content);
          }
        }

        return validateNutritionLabelResult(parsed);
      });
    } catch (error: unknown) {
      const errorMessage = formatAIError(error);
      return {
        energy_kj: 0,
        energy_kcal: 0,
        protein_g: 0,
        fat_g: 0,
        carbs_g: 0,
        fiber_g: 0,
        sugar_g: 0,
        sodium_mg: 0,
        cholesterol_mg: 0,
        saturated_fat_g: 0,
        trans_fat_g: 0,
        serving_label: '',
        serving_base_grams: 100,
        product_name: '',
        error: errorMessage,
      };
    }
  }

  private formatCoachMessages(messages: ChatMessage[], userProfile: UserProfile, foodLog: FoodEntry[]) {
    const systemPrompt = buildCoachSystemPrompt(userProfile, foodLog);
    return [
      { role: 'system' as const, content: systemPrompt },
      ...messages.slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];
  }

  async chatWithCoach(
    messages: ChatMessage[],
    userProfile: UserProfile,
    foodLog: FoodEntry[]
  ): Promise<ReadableStream<string> | string> {
    const formattedMessages = this.formatCoachMessages(messages, userProfile, foodLog);

    return withRetry(async () => {
      const response = await this.client.chat.completions.create({
        model: this.config.models.chat,
        messages: formattedMessages,
        temperature: 0.7,
        stream: true,
      });

      if (response instanceof ReadableStream) {
        return response as ReadableStream<string>;
      }

      const stream = response as unknown as ReadableStream<string>;
      return stream;
    });
  }

  async chatWithCoachNonStream(
    messages: ChatMessage[],
    userProfile: UserProfile,
    foodLog: FoodEntry[]
  ): Promise<string> {
    const formattedMessages = this.formatCoachMessages(messages, userProfile, foodLog);

    return withRetry(async () => {
      const response = await this.client.chat.completions.create({
        model: this.config.models.chat,
        messages: formattedMessages,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || '';
    });
  }

  async analyzeTextFood(textDescription: string): Promise<MultiFoodAnalysisResult> {
    if (!textDescription.trim()) {
      return { items: [], error: '请输入食物描述' };
    }

    return withRetry(async () => {
      const response = await this.client.chat.completions.create({
        model: this.config.models.chat,
        messages: [
          { role: 'system', content: TEXT_FOOD_ANALYSIS_SYSTEM_PROMPT },
          { role: 'user', content: textDescription },
        ],
        max_tokens: 1024,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from AI');

      const parsed = safeJsonParse(content);
      return validateMultiFoodAnalysisResult(parsed);
    });
  }
}

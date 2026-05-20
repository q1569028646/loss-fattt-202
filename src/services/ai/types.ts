export interface AIProviderConfig {
  id: string;
  name: string;
  baseURL: string;
  apiKey: string;
  models: {
    vision: string;
    ocr: string;
    chat: string;
  };
  headers?: Record<string, string>;
}

// 默认API密钥从环境变量读取，不再硬编码
// 用户需要在设置中配置自己的API密钥
const DEFAULT_API_KEY = '';

export const DEFAULT_PROVIDERS: Omit<AIProviderConfig, 'apiKey'>[] = [
  {
    id: 'siliconflow-deepseek-ocr',
    name: '硅基流动-DeepSeek-OCR',
    baseURL: 'https://api.siliconflow.cn/v1',
    models: {
      vision: 'deepseek-ai/DeepSeek-VL2',
      ocr: 'deepseek-ai/DeepSeek-OCR',
      chat: 'deepseek-ai/DeepSeek-V3',
    },
  },
  {
    id: 'siliconflow',
    name: '硅基流动',
    baseURL: 'https://api.siliconflow.cn/v1',
    models: {
      vision: 'Qwen/Qwen2-VL-72B-Instruct',
      ocr: 'Qwen/Qwen2-VL-72B-Instruct',
      chat: 'Qwen/Qwen2.5-72B-Instruct',
    },
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    models: {
      vision: 'deepseek-chat',
      ocr: 'deepseek-chat',
      chat: 'deepseek-chat',
    },
  },
  {
    id: 'dashscope',
    name: '阿里云百炼',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: {
      vision: 'qwen-vl-max',
      ocr: 'qwen-vl-max',
      chat: 'qwen-max',
    },
  },
  {
    id: 'doubao',
    name: '火山引擎豆包',
    baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
    models: {
      vision: 'doubao-vision-pro-32k',
      ocr: 'doubao-vision-pro-32k',
      chat: 'doubao-pro-32k',
    },
  },
];

export function getDefaultProviderConfig(): AIProviderConfig | null {
  const provider = DEFAULT_PROVIDERS.find(p => p.id === 'siliconflow-deepseek-ocr');
  if (!provider) {
    console.error('Default provider not found');
    return null;
  }
  return {
    ...provider,
    apiKey: DEFAULT_API_KEY,
  };
}

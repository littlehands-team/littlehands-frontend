import { Product } from './product.model';

export interface Message {
  id?: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
  products?: Product[];
}

export interface ChatRequest {
  currentMessage: string;
  previousMessages: Array<{
    text: string;
    isBot: boolean;
  }>;
  memoryBank: any[];
  answers?: any;
}

export interface ChatResponse {
  botMessage: string;
}

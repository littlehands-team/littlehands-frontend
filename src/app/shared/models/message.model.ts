export interface Message {
  id?: number;
  text: string;
  isBot: boolean;
  timestamp: Date;
}

export interface ChatRequest {
  currentMessage: string;
  previousMessages: Array<{
    text: string;
    isBot: boolean;
  }>;
  memoryBank: any[];
}

export interface ChatResponse {
  botMessage: string;
}

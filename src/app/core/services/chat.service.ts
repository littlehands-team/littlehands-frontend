import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from './environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChatRequest, ChatResponse, Message } from '../../shared/models/message.model';
import {Answers} from '../../shared/models/Answers.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  sendMessage(currentMessage: string, previousMessages: Message[]): Observable<string> {
    console.log(currentMessage);
    const payload: ChatRequest = {
      currentMessage: currentMessage,
      previousMessages: previousMessages.map(msg => ({
        text: msg.text,
        isBot: msg.isBot
      })),
      memoryBank: []
    };

    return this.http.post<ChatResponse>(`${this.apiUrl}/chat/global/`, payload)
      .pipe(
        map(response => response.botMessage)
      );
  }

  sendRecommendToyMessage(
    currentMessage: string,
    previousMessages: Message[],
    answers: Answers
  ): Observable<any> {
    const payload: ChatRequest = {
      currentMessage,
      previousMessages: previousMessages.map(msg => ({
        text: msg.text,
        isBot: msg.isBot
      })),
      memoryBank: [],
      answers // 👈 aquí se envía el formulario completo
    };

    console.log(answers)
    return this.http.post<ChatResponse>(`${this.apiUrl}/chat/recommendation/`, payload)
      .pipe(
        map(response => response.botMessage)
      );
  }
}

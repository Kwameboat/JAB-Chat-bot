export enum Sender {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system'
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: Date;
  isEmailSummary?: boolean; // Flag to style the final email summary differently
}

export interface BookingDetails {
  name: string;
  service: string;
  goal: string;
  budget: string;
}

export interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

export enum ChatRole {
  USER = 'user',
  MODEL = 'model',
}

export type HelpArea = 'Planning' | 'UI/UX Design' | 'Code' | 'General';

export interface GroundingLink {
  title: string;
  uri: string;
}

export interface ChatMessage {
  role: ChatRole;
  content: string;
  images?: string[]; // Array of Base64 encoded image data URLs
  url?: string;    // Reference URL
  groundingLinks?: GroundingLink[];
}

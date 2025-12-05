export interface ValueChainStep {
  id: string;
  label: string;
  summary: string;
  description: string;
}

export interface ReadingMaterial {
  id: string;
  title: string;
  valueChain: string;
  majors: string[];
  keywords: string[];
  content: string;
  searchKeywords?: string[];
  references?: { title: string; url?: string }[];
  isGenerated?: boolean;
}

export interface UniversitySubject {
  subject: string;
  major: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  type?: 'value_chain_intro' | 'normal';
  valueChain?: string;
  timestamp?: number;
}

export interface EsgThoughts {
  env: string;
  soc: string;
  eco: string;
}

export interface EsgScenario {
  title: string;
  content: string;
}

export enum AppView {
  LANDING = 'LANDING',
  PERIOD1 = 'PERIOD1',
  PERIOD2 = 'PERIOD2',
  ADMIN = 'ADMIN'
}
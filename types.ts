
export interface AnalysisState {
  isLoading: boolean;
  result: string | null;
  groundingMetadata: any | null;
  error: string | null;
}

export interface ImageFile {
  file: File;
  previewUrl: string;
}

export enum AnalysisType {
  GENERAL_AUDIT = 'GENERAL_AUDIT',
  WEBSITE_PITCH = 'WEBSITE_PITCH',
  AUTOMATION_OPPORTUNITIES = 'AUTOMATION_OPPORTUNITIES'
}

export type AppMode = 'IMAGE' | 'SEARCH' | 'SELF_AUDIT';

export type PitchTone = 'STANDARD' | 'PAIN_FOCUSED';
export type PitchLength = 'SHORT' | 'STANDARD';

export type OutputLanguage = 'English' | 'Spanish' | 'French' | 'Portuguese (Portugal)' | 'Portuguese (Brazil)' | 'German' | 'Italian' | 'Dutch' | 'Chinese' | 'Japanese';

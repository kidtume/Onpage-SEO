
export interface SEOInput {
  mainKeyword: string;
  url: string;
  title: string;
  metaDescription: string;
  content: string;
  outline: string;
}

export interface CheckResult {
  id: string;
  label: string;
  status: 'passed' | 'failed' | 'warning' | 'pending';
  message?: string;
  description?: string; // Giải thích cho tooltip
}

export interface SEOAnalysis {
  onPage: CheckResult[];
  outline: CheckResult[];
  writing: CheckResult[];
  overallScore: number;
  subScores?: {
    onpage: number;
    outline: number;
    writing: number;
  };
  strategicReport?: {
    pros: string[];
    cons: string[];
    summary: string;
  };
  aiFeedback: string;
}

export interface SEOHistoryItem {
  id: string;
  timestamp: number;
  input: SEOInput;
  analysis: SEOAnalysis;
}

export enum TabType {
  INPUT = 'INPUT',
  ANALYSIS = 'ANALYSIS',
  HISTORY = 'HISTORY',
}

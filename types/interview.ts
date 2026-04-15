export interface Question {
  id: string;
  section: string;
  text: string;
  placeholder: string;
  extracting: string;
}

export interface Section {
  id: string;
  title: string;
  questions: Question[];
}

export type InterviewAnswers = Record<string, string>;

export interface VisionDocument {
  problemStatement: string;
  vision: string;
  targetUsers: string;
  userNeeds: string;
  solutionOverview: string;
  businessModel: string;
  successMetrics: string;
}

export interface Lead {
  email: string;
  answers: InterviewAnswers;
  generatedAt: string;
}

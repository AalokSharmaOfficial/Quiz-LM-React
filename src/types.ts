export interface SourceInfo {
  examName: string;
  examYear: number;
  examDateShift: string;
}

export interface Classification {
  subject: string;
  topic: string;
  subTopic: string;
}

export interface Properties {
  difficulty: string;
  questionType: string;
}

export interface Explanation {
  summary: string;
  analysis_correct: string;
  analysis_incorrect: string;
  conclusion: string;
  fact: string;
}

export interface Question {
  id: string;
  sourceInfo: SourceInfo;
  classification: Classification;
  tags: string[];
  properties: Properties;
  question: string;
  question_hi: string;
  options: string[];
  options_hi: string[];
  correct: string;
  explanation: Explanation;
}

export interface SettingsContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  areAnimationsEnabled: boolean;
  toggleAnimations: () => void;
  isSoundEnabled: boolean;
  toggleSound: () => void;
  isHapticEnabled: boolean;
  toggleHaptics: () => void;
  areBgAnimationsEnabled: boolean;
  toggleBgAnimations: () => void;
}

export const initialFilters = {
  subject: [] as string[],
  topic: [] as string[],
  subTopic: [] as string[],
  examName: [] as string[],
  examYear: [] as string[],
  tags: [] as string[],
  difficulty: [] as string[],
  questionType: [] as string[]
};

export type InitialFilters = typeof initialFilters;

export const filterKeys: (keyof InitialFilters)[] = [
    'subject', 'topic', 'subTopic', 'examName', 'examYear', 'tags', 'difficulty', 'questionType'
];

export const getQuestionValue = (question: Question, key: keyof InitialFilters): string | string[] | undefined => {
    switch (key) {
        case 'subject': return question.classification.subject;
        case 'topic': return question.classification.topic;
        case 'subTopic': return question.classification.subTopic;
        case 'examName': return question.sourceInfo.examName;
        case 'examYear': return String(question.sourceInfo.examYear);
        case 'tags': return question.tags;
        case 'difficulty': return question.properties.difficulty;
        case 'questionType': return question.properties.questionType;
        default: return undefined;
    }
}

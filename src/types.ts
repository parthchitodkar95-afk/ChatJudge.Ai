/**
 * Types for ChatJudge Application
 */

export interface Evidence {
  trait: string;
  quote: string;
  explanation: string;
}

export interface PersonScores {
  toxicity: number;
  ego: number;
  attitude: number;
  love: number;
  hate: number;
  humor: number;
  dominance: number;
  coldness: number;
}

export interface PersonAnalysis {
  name: string;
  verdict: string;
  scores: PersonScores;
  evidence: Evidence[];
  roast?: string;
  redFlags?: string[];
  greenFlags?: string[];
}

export interface RelationshipAnalysis {
  score: number;
  label: string;
  summary: string;
}

export interface ApologyVerdict {
  shouldApologizeFirst: string;
  reasoning: string;
}

export interface RelationshipAdvice {
  actionableSteps: string[];
  coupleChallenge: string;
}

export interface ChatJudgeReport {
  persons: PersonAnalysis[];
  relationship: RelationshipAnalysis;
  apologyVerdict?: ApologyVerdict;
  relationshipAdvice?: RelationshipAdvice;
}

export interface MessageLine {
  sender: string;
  text: string;
  timestamp?: string;
}

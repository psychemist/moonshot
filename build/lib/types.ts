import type { KnowledgeId } from "./knowledge";
export type { KnowledgeId } from "./knowledge";

export interface LearnerProfile {
  goal: string;
  priorKnowledge: KnowledgeId[];
  weeklyHours: string;
}

export interface LearningNode {
  id: string;
  title: string;
  kind: "concept" | "project";
  description: string;
}

export interface Resource {
  id: string;
  title: string;
  provider: string;
  url: string;
  conceptIds?: string[];
  reviewedOn?: string;
}

export interface TaskTemplate {
  id: string;
  conceptId: string;
  title: string;
  exercise: string;
  expectedOutput: string;
  estimatedMinutes: number;
  resourceId: string;
  explanation: string;
  startingAction: string;
  practiceSteps: { id: string; action: string }[];
}

export interface LearningPath {
  goal: string;
  aliases: string[];
  nodes: LearningNode[];
  edges: { from: string; to: string; relation: "prerequisite" | "useful_for" }[];
  resources: Resource[];
  tasks: TaskTemplate[];
}

export interface StudyPlan {
  goal: string;
  weeklyHours: number;
  roadmap: (LearningNode & { status: "self-reported" | "next" | "ready" | "blocked" | "upcoming" })[];
  edges: LearningPath["edges"];
  task: TaskTemplate;
  resource: Resource;
  allocatedMinutes: number;
  remainingMinutes: number;
}

export type PlanResult =
  | { ok: true; plan: StudyPlan }
  | { ok: false; errors: { goal?: string; weeklyHours?: string } };

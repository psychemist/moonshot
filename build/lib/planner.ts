import pathData from "./learning-path.json";
import type { LearnerProfile, LearningPath, PlanResult, StudyPlan } from "./types";

export const learningPath = pathData as LearningPath;

const normalizeGoal = (goal: string) => goal.trim().toLowerCase();

/** Check the editorial fixture rather than trusting array order or dangling references. */
export function validateLearningPath(path: LearningPath): string[] {
  const issues: string[] = [];
  const nodeIds = new Set(path.nodes.map((node) => node.id));
  const resourceIds = new Set(path.resources.map((resource) => resource.id));
  if (nodeIds.size !== path.nodes.length) issues.push("Duplicate node identifier.");
  if (resourceIds.size !== path.resources.length) issues.push("Duplicate resource identifier.");
  if (new Set(path.tasks.map((task) => task.id)).size !== path.tasks.length) {
    issues.push("Duplicate task identifier.");
  }
  for (const edge of path.edges) {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) issues.push("Unknown edge endpoint.");
  }
  for (const task of path.tasks) {
    if (!path.nodes.some((node) => node.id === task.conceptId)) {
      issues.push("Unknown task concept.");
    }
    if (!resourceIds.has(task.resourceId)) issues.push("Unknown task resource.");
    if (!Number.isFinite(task.estimatedMinutes) || task.estimatedMinutes <= 0) {
      issues.push("Invalid task estimate.");
    }
  }
  for (const node of path.nodes) {
    if (path.tasks.filter((task) => task.conceptId === node.id).length !== 1) {
      issues.push("Each roadmap step needs exactly one task.");
    }
  }
  for (const resource of path.resources) {
    if (resource.conceptIds?.some((id) => !nodeIds.has(id))) issues.push("Unknown resource concept.");
    try {
      if (new URL(resource.url).protocol !== "https:") issues.push("Resource must use HTTPS.");
    } catch {
      issues.push("Invalid resource URL.");
    }
  }
  if (topologicalOrder(path).length !== path.nodes.length) issues.push("Prerequisite cycle.");
  return issues;
}

export function topologicalOrder(path: LearningPath): LearningPath["nodes"] {
  const ordered: LearningPath["nodes"] = [];
  const remaining = new Set(path.nodes.map((node) => node.id));
  while (remaining.size) {
    const reachable = path.nodes.find((node) => remaining.has(node.id) &&
      path.edges.filter((edge) => edge.to === node.id && edge.relation === "prerequisite").every((edge) => !remaining.has(edge.from)));
    if (!reachable) break;
    ordered.push(reachable);
    remaining.delete(reachable.id);
  }
  return ordered;
}

export function getRoadmap(priorKnowledge: readonly string[], path: LearningPath = learningPath): StudyPlan["roadmap"] {
  const known = new Set(priorKnowledge);
  const ordered = topologicalOrder(path);
  const reachable = (id: string) => path.edges
    .filter((edge) => edge.to === id && edge.relation === "prerequisite")
    .every((edge) => known.has(edge.from));
  const next = ordered.find((node) => !known.has(node.id) && reachable(node.id));
  return ordered.map((node) => ({
    ...node,
    status: known.has(node.id) ? "self-reported" : node.id === next?.id ? "next" :
      reachable(node.id) ? "ready" : "blocked",
  }));
}

export function getNodeResources(nodeId: string, path: LearningPath = learningPath) {
  const taskSources = new Set(path.tasks.filter((task) => task.conceptId === nodeId).map((task) => task.resourceId));
  return path.resources.filter((resource) => taskSources.has(resource.id) || resource.conceptIds?.includes(nodeId));
}

/** Pure, local recommendation: no model calls, mutation, or network requests. */
export function generatePlan(profile: LearnerProfile, path: LearningPath = learningPath): PlanResult {
  const errors: { goal?: string; weeklyHours?: string } = {};
  const supportedGoals = [path.goal, ...path.aliases].map(normalizeGoal);
  if (!supportedGoals.includes(normalizeGoal(profile.goal))) {
    errors.goal = `This preview supports one goal: ${path.goal}. Choose it to continue.`;
  }
  const rawHours = profile.weeklyHours.trim();
  const hours = Number(rawHours);
  const decimal = /^[+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(rawHours);
  if (!decimal || !Number.isFinite(hours) || hours <= 0) {
    errors.weeklyHours = "Enter a positive number of weekly hours, such as 6 or 0.5.";
  }
  if (Object.keys(errors).length) return { ok: false, errors };

  const fixtureIssues = validateLearningPath(path);
  if (fixtureIssues.length) throw new Error(`Invalid learning path: ${fixtureIssues.join(" ")}`);

  const roadmap = getRoadmap(profile.priorKnowledge, path);
  const next = roadmap.find((node) => node.status === "next");
  const task = path.tasks.find((candidate) => candidate.conceptId === next?.id);
  if (!task) throw new Error("No reachable learning task in this fixture.");
  const resource = path.resources.find((candidate) => candidate.id === task.resourceId)!;
  // Bound before converting to minutes, avoiding overflow for a large finite input.
  const allocatedMinutes = Math.min(hours, task.estimatedMinutes / 60) * 60;

  return {
    ok: true,
    plan: {
      goal: path.goal,
      weeklyHours: hours,
      roadmap,
      edges: path.edges,
      task,
      resource,
      allocatedMinutes,
      remainingMinutes: Math.max(0, task.estimatedMinutes - allocatedMinutes),
    },
  };
}

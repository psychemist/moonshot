import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod/v4";
import { generatePlan, getNodeResources, learningPath, validateLearningPath } from "../lib/planner";
import { knowledgeOptions } from "../lib/knowledge";

const knowledgeIds = knowledgeOptions.map((option) => option.id);

const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

function response(data: Record<string, unknown>, isError = false) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }], structuredContent: data, isError };
}

export function createLearningGraphServer() {
  const issues = validateLearningPath(learningPath);
  if (issues.length) throw new Error(`Invalid learning path: ${issues.join(" ")}`);

  const server = new McpServer({ name: "learning-graph", version: "0.2.0" }, {
    instructions: "Learning Graph provides one curated assembler-in-C roadmap. Use list_learning_goals before planning. Plans and resources are authoritative for this catalog; do not invent prerequisites or claim mastery. Prior knowledge is self-reported. Tools are read-only: no progress is saved, no learner code runs, and no external resource is fetched. The assistant supplies coaching; this server contains no model.",
  });

  server.registerTool("list_learning_goals", {
    description: "List the supported goals, accepted prior-knowledge identifiers, and prototype limits. Reads bundled metadata; no network or account required.",
    inputSchema: z.strictObject({}),
    annotations,
  }, async () => response({
    goals: [{ id: "hack-assembler", name: learningPath.goal, aliases: learningPath.aliases }],
    priorKnowledgeOptions: knowledgeOptions,
    limits: { concepts: learningPath.nodes.filter((node) => node.kind === "concept").length,
      projects: learningPath.nodes.filter((node) => node.kind === "project").length,
      resources: learningPath.resources.length, savesProgress: false, assessesMastery: false, fetchesResourceContent: false },
  }));

  server.registerTool("generate_learning_plan", {
    description: "Generate a next-task plan using the same deterministic planner as the website. weekly_hours is the learner's weekly budget, not a single-session length. Prior knowledge is self-reported. Returns roadmap, exercise, expected output, provisional estimate, source, explanation, allocation, and remaining time. Unsupported goals return an error; nothing is persisted.",
    inputSchema: z.strictObject({
      goal: z.string().trim().min(1),
      prior_knowledge: z.array(z.enum(knowledgeIds)),
      weekly_hours: z.number().finite().positive(),
    }),
    annotations,
  }, async ({ goal, prior_knowledge, weekly_hours }) => {
    try {
      const result = generatePlan({ goal, priorKnowledge: prior_knowledge, weeklyHours: String(weekly_hours) });
      return response({ ...result }, !result.ok);
    } catch {
      return response({ ok: false, error: { code: "planning_unavailable", message: "The reviewed path cannot produce a task. No plan was generated; do not substitute an invented roadmap." } }, true);
    }
  });

  server.registerTool("get_concept_resources", {
    description: "Return the reviewed source links attached to a supported concept. Metadata only: does not visit URLs, search the web, or return course content. Use a concept_id from the generated roadmap.",
    inputSchema: z.strictObject({ concept_id: z.string().trim().min(1) }),
    annotations,
  }, async ({ concept_id }) => {
    const concept = learningPath.nodes.find((node) => node.id === concept_id && node.kind === "concept");
    if (!concept) return response({ ok: false, error: { code: "unknown_concept", message: "Choose a concept from the supported roadmap.", supportedConceptIds: learningPath.nodes.filter((node) => node.kind === "concept").map((node) => node.id) } }, true);
    return response({ ok: true, concept, resources: getNodeResources(concept.id), resourceContentFetched: false });
  });

  return server;
}

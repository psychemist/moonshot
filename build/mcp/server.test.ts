import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { connectLearningGraph } from "./client";
import { generatePlan, learningPath } from "../lib/planner";

let client: Awaited<ReturnType<typeof connectLearningGraph>>;

beforeAll(async () => { client = await connectLearningGraph("learning-graph-protocol-tests"); }, 15_000);
afterAll(async () => { await client?.close(); });

describe("real MCP stdio server", () => {
  it("discovers exactly three read-only tools", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name).sort()).toEqual([
      "generate_learning_plan", "get_concept_resources", "list_learning_goals",
    ]);
    for (const tool of tools) {
      expect(tool.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false });
    }
  });

  it("reports the actual supported catalog and prototype limits", async () => {
    const result = await client.callTool({ name: "list_learning_goals", arguments: {} });
    expect(result.isError).toBe(false);
    expect(result.structuredContent).toMatchObject({
      goals: [{ name: learningPath.goal, aliases: learningPath.aliases }],
      limits: { concepts: 12, projects: 1, resources: 8, savesProgress: false, assessesMastery: false, fetchesResourceContent: false },
    });
  });

  it.each([
    { hours: 6, known: false }, { hours: 12, known: false },
    { hours: 6, known: true }, { hours: 12, known: true },
    { hours: 0.5, known: true },
  ])("matches the website planner for $hours hours, C known: $known", async ({ hours, known }) => {
    const priorKnowledge = known ? ["c-essentials" as const] : [];
    const expected = generatePlan({ goal: "  HACK ASSEMBLER  ", priorKnowledge, weeklyHours: String(hours) });
    const result = await client.callTool({
      name: "generate_learning_plan",
      arguments: { goal: "  HACK ASSEMBLER  ", prior_knowledge: priorKnowledge, weekly_hours: hours },
    });
    expect(result.isError).toBe(false);
    expect(result.structuredContent).toEqual(expected);
    const text = result.content.find((block) => block.type === "text");
    expect(text?.type === "text" && JSON.parse(text.text)).toEqual(expected);
  });

  it("rejects an unsupported goal without returning a fabricated plan", async () => {
    const result = await client.callTool({
      name: "generate_learning_plan",
      arguments: { goal: "learn robotics", prior_knowledge: [], weekly_hours: 12 },
    });
    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({ ok: false, errors: { goal: expect.stringContaining(learningPath.goal) } });
    expect(result.structuredContent).not.toHaveProperty("plan");
  });

  it.each([
    { goal: learningPath.goal, prior_knowledge: [], weekly_hours: 0 },
    { goal: learningPath.goal, prior_knowledge: [], weekly_hours: -1 },
    { goal: learningPath.goal, prior_knowledge: [], weekly_hours: "half an hour" },
    { goal: learningPath.goal, prior_knowledge: ["unknown-skill"], weekly_hours: 12 },
    { goal: learningPath.goal, weekly_hours: 12 },
    { goal: learningPath.goal, prior_knowledge: [], weekly_hours: 12, saveProgress: true },
  ])("rejects invalid arguments at the protocol boundary: %j", async (args) => {
    const result = await client.callTool({ name: "generate_learning_plan", arguments: args });
    expect(result.isError).toBe(true);
    expect(result.structuredContent ?? {}).not.toHaveProperty("plan");
    expect(result.content.some((block) => block.type === "text" && block.text.length > 0)).toBe(true);
  });

  it.each([
    { concept: "c-essentials", provider: "GNU Project" },
    { concept: "text-parsing", provider: "Nand2Tetris" },
  ])("returns reviewed metadata for $concept", async ({ concept, provider }) => {
    const result = await client.callTool({ name: "get_concept_resources", arguments: { concept_id: concept } });
    expect(result.isError).toBe(false);
    expect(result.structuredContent).toMatchObject({
      ok: true, concept: { id: concept }, resources: expect.arrayContaining([expect.objectContaining({ provider, url: expect.stringMatching(/^https:\/\//) })]), resourceContentFetched: false,
    });
  });

  it.each(["hack-assembler", "missing", "../../.env"])("rejects unsupported concept %s", async (concept_id) => {
    const result = await client.callTool({ name: "get_concept_resources", arguments: { concept_id } });
    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({ ok: false, error: { code: "unknown_concept", supportedConceptIds: expect.arrayContaining(["c-essentials", "text-parsing", "symbol-tables"]) } });
  });

  it("gives identical results on repeated planning calls", async () => {
    const request = { name: "generate_learning_plan", arguments: { goal: learningPath.goal, prior_knowledge: [], weekly_hours: 0.5 } };
    const first = await client.callTool(request);
    const second = await client.callTool(request);
    expect(second.structuredContent).toEqual(first.structuredContent);
  });
});

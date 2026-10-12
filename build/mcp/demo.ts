import assert from "node:assert/strict";
import { connectLearningGraph } from "./client";

const client = await connectLearningGraph("learning-graph-demo");
try {
  const tools = await client.listTools();
  const goals = await client.callTool({ name: "list_learning_goals", arguments: {} });
  const result = await client.callTool({
    name: "generate_learning_plan",
    arguments: { goal: "build an assembler in C", prior_knowledge: ["c-essentials"], weekly_hours: 0.5 },
  });
  assert(!result.isError, "The demo plan should succeed.");
  const planResult = result.structuredContent as { ok: boolean; plan: { task: { conceptId: string; title: string }; allocatedMinutes: number; remainingMinutes: number } };
  assert(planResult.ok);
  assert.equal(planResult.plan.task.conceptId, "text-parsing");
  assert.equal(planResult.plan.allocatedMinutes, 30);
  assert.equal(planResult.plan.remainingMinutes, 60);
  const resources = await client.callTool({ name: "get_concept_resources", arguments: { concept_id: planResult.plan.task.conceptId } });
  console.log(JSON.stringify({
    note: "Real MCP protocol demo; this script does not generate AI coaching.",
    tools: tools.tools.map((tool) => tool.name), goals: goals.structuredContent,
    result: result.structuredContent, resources: resources.structuredContent,
  }, null, 2));
} finally {
  await client.close();
}

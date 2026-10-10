import { describe, expect, it } from "vitest";
import { generatePlan, getRoadmap, learningPath, validateLearningPath } from "./planner";
import type { LearnerProfile, StudyPlan } from "./types";

const profile: LearnerProfile = {
  goal: "build an assembler in C",
  priorKnowledge: ["python", "javascript", "basic-calculus"],
  weeklyHours: "12",
};

function planFor(changes: Partial<LearnerProfile> = {}): StudyPlan {
  const result = generatePlan({ ...profile, ...changes });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("Expected a plan.");
  return result.plan;
}

describe("goal recognition and input errors", () => {
  it.each([learningPath.goal, ...learningPath.aliases, "  BUILD AN ASSEMBLER IN C  "])("accepts %s", (goal) => {
    expect(planFor({ goal }).goal).toBe(learningPath.goal);
  });

  it("offers the supported goal without substituting for unsupported input", () => {
    const result = generatePlan({ ...profile, goal: "learn robotics" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.goal).toContain(learningPath.goal);
    expect(result).not.toHaveProperty("plan");
  });

  it.each(["", " ", "0", "-1", "NaN", "Infinity", "1e999", "six", "0x10"])("rejects weekly hours %s", (weeklyHours) => {
    const result = generatePlan({ ...profile, weeklyHours });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.weeklyHours).toContain("positive number");
  });

  it("reports both invalid fields together", () => {
    const result = generatePlan({ ...profile, goal: "", weeklyHours: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors)).toEqual(["goal", "weeklyHours"]);
  });
});

describe("personalized next task", () => {
  it("starts with C essentials when C is unknown", () => {
    const plan = planFor();
    expect(plan.task.conceptId).toBe("c-essentials");
    expect(plan.task.expectedOutput).toContain("prints 5");
    expect(plan.task.estimatedMinutes).toBe(60);
    expect(plan.resource.provider).toBe("GNU Project");
    expect(plan.roadmap[0].status).toBe("next");
  });

  it("skips the C introduction while retaining its self-reported node", () => {
    const plan = planFor({ priorKnowledge: [...profile.priorKnowledge, "c-essentials"] });
    expect(plan.task.conceptId).toBe("text-parsing");
    expect(plan.task.estimatedMinutes).toBe(90);
    expect(plan.task.explanation).toContain("prior knowledge");
    expect(plan.resource.provider).toBe("Nand2Tetris");
    expect(plan.roadmap).toHaveLength(13);
    expect(plan.roadmap.find((node) => node.id === "c-essentials")?.status).toBe("self-reported");
    expect(plan.roadmap.find((node) => node.id === "text-parsing")?.status).toBe("next");
    expect(plan.roadmap.find((node) => node.id === "hack-assembler")?.status).toBe("blocked");
  });

  it("does not equate Python, JavaScript, or calculus with C competence", () => {
    expect(planFor({ priorKnowledge: [] }).task.id).toBe(planFor().task.id);
  });

  it.each([6, 12])("fits either knowledge profile into a %s-hour budget", (hours) => {
    for (const priorKnowledge of [profile.priorKnowledge, [...profile.priorKnowledge, "c-essentials"] as LearnerProfile["priorKnowledge"]]) {
      const plan = planFor({ weeklyHours: String(hours), priorKnowledge });
      expect(plan.allocatedMinutes).toBeLessThanOrEqual(hours * 60);
      expect(plan.allocatedMinutes).toBe(plan.task.estimatedMinutes);
      expect(plan.remainingMinutes).toBe(0);
    }
  });

  it.each([0.5, 0.1, 0.01])("carries remaining work forward for a %s-hour budget", (hours) => {
    const plan = planFor({ weeklyHours: String(hours) });
    expect(plan.allocatedMinutes).toBeCloseTo(hours * 60);
    expect(plan.remainingMinutes + plan.allocatedMinutes).toBeCloseTo(plan.task.estimatedMinutes);
  });

  it("keeps allocation finite for a very large finite input", () => {
    expect(planFor({ weeklyHours: "1e308" }).allocatedMinutes).toBe(60);
  });

  it("does not mutate the learner profile or fixture", () => {
    const before = JSON.stringify({ profile, learningPath });
    generatePlan(profile);
    expect(JSON.stringify({ profile, learningPath })).toBe(before);
  });
});

describe("fixture integrity", () => {
  it("covers twelve concepts, one project, eight sources, and valid references", () => {
    expect(learningPath.nodes.filter((node) => node.kind === "concept")).toHaveLength(12);
    expect(learningPath.nodes.filter((node) => node.kind === "project")).toHaveLength(1);
    expect(learningPath.resources).toHaveLength(8);
    expect(learningPath.tasks).toHaveLength(13);
    expect(validateLearningPath(learningPath)).toEqual([]);
  });

  it("detects a prerequisite cycle", () => {
    const fixture = structuredClone(learningPath);
    fixture.edges.push({ from: "hack-assembler", to: "c-essentials", relation: "prerequisite" });
    expect(validateLearningPath(fixture)).toContain("Prerequisite cycle.");
    expect(() => generatePlan(profile, fixture)).toThrow("Invalid learning path");
  });

  it("detects dangling task, resource, and edge references", () => {
    const fixture = structuredClone(learningPath);
    fixture.tasks[0].conceptId = "missing-concept";
    fixture.tasks[0].resourceId = "missing-resource";
    fixture.edges[0].from = "missing-node";
    expect(validateLearningPath(fixture)).toEqual(expect.arrayContaining([
      "Unknown task concept.", "Unknown task resource.", "Unknown edge endpoint.",
    ]));
  });

  it("detects duplicate identifiers and unsafe resource links", () => {
    const fixture = structuredClone(learningPath);
    fixture.nodes.push(fixture.nodes[0]);
    fixture.resources[0].url = "javascript:alert(1)";
    expect(validateLearningPath(fixture)).toEqual(expect.arrayContaining([
      "Duplicate node identifier.", "Resource must use HTTPS.",
    ]));
  });

  it("resolves prerequisites before dependent concepts even if nodes are reordered", () => {
    const fixture = structuredClone(learningPath);
    fixture.nodes.reverse();
    const result = generatePlan(profile, fixture);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const ids = result.plan.roadmap.map((node) => node.id);
      for (const edge of fixture.edges.filter((edge) => edge.relation === "prerequisite")) {
        expect(ids.indexOf(edge.from)).toBeLessThan(ids.indexOf(edge.to));
      }
    }
  });

  it("does not let optional background block the first parsing task", () => {
    const plan = planFor({ priorKnowledge: ["c-essentials"] });
    expect(plan.task.conceptId).toBe("text-parsing");
    expect(plan.roadmap.find((node) => node.id === "c-strings")?.status).not.toBe("self-reported");
  });

  it("selects the final project task when all concepts are self-reported", () => {
    const priorKnowledge = learningPath.nodes.filter((node) => node.kind === "concept").map((node) => node.id) as LearnerProfile["priorKnowledge"];
    const plan = planFor({ priorKnowledge });
    expect(plan.task.conceptId).toBe("hack-assembler");
    expect(plan.roadmap.filter((node) => node.status === "self-reported")).toHaveLength(12);
    expect(plan.resource.provider).toBe("Nand2Tetris");
  });

  it("exposes actual dependency edges alongside the whole roadmap", () => {
    expect(planFor().edges).toEqual(learningPath.edges);
    expect(getRoadmap(profile.priorKnowledge)).toHaveLength(13);
  });
});

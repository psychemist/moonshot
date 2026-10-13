import { describe, expect, it } from "vitest";
import { layoutGraph } from "./graph-layout";
import { learningPath } from "./planner";

describe("whole roadmap layout", () => {
  it("positions every step inside the canvas without overlapping nodes", () => {
    const graph = layoutGraph(learningPath);
    expect(graph.positions.size).toBe(13);
    const positions = [...graph.positions.values()];
    for (const position of positions) {
      expect(position.x).toBeGreaterThanOrEqual(0);
      expect(position.y).toBeGreaterThanOrEqual(0);
      expect(position.x + graph.nodeWidth).toBeLessThanOrEqual(graph.width);
      expect(position.y + graph.nodeHeight).toBeLessThanOrEqual(graph.height);
    }
    for (let i = 0; i < positions.length; i++) for (let j = i + 1; j < positions.length; j++) {
      const a = positions[i], b = positions[j];
      expect(a.x + graph.nodeWidth <= b.x || b.x + graph.nodeWidth <= a.x ||
        a.y + graph.nodeHeight <= b.y || b.y + graph.nodeHeight <= a.y).toBe(true);
    }
  });

  it("places each hard prerequisite above the step it enables", () => {
    const graph = layoutGraph(learningPath);
    for (const edge of learningPath.edges.filter((edge) => edge.relation === "prerequisite")) {
      expect(graph.positions.get(edge.from)!.y + graph.nodeHeight).toBeLessThan(graph.positions.get(edge.to)!.y);
    }
  });
});

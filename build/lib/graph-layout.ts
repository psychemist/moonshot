import type { LearningPath } from "./types";
import { topologicalOrder } from "./planner";

/** Layer the hard prerequisite DAG; optional links never create extra learning levels. */
export function layoutGraph(path: LearningPath) {
  const ordered = topologicalOrder(path);
  const levels = new Map<string, number>();
  for (const node of ordered) {
    const parents = path.edges.filter((edge) => edge.to === node.id && edge.relation === "prerequisite");
    levels.set(node.id, parents.length ? Math.max(...parents.map((edge) => levels.get(edge.from) ?? 0)) + 1 : 0);
  }
  const rows = new Map<number, string[]>();
  for (const node of ordered) {
    const level = levels.get(node.id)!;
    rows.set(level, [...(rows.get(level) ?? []), node.id]);
  }
  const nodeWidth = 160;
  const nodeHeight = 76;
  const gap = 22;
  const rowGap = 46;
  const padding = 26;
  const columns = Math.max(1, ...[...rows.values()].map((row) => row.length));
  const width = columns * nodeWidth + (columns - 1) * gap + padding * 2;
  const height = rows.size * nodeHeight + Math.max(0, rows.size - 1) * rowGap + padding * 2;
  const positions = new Map<string, { x: number; y: number }>();
  for (const [level, row] of rows) {
    const rowWidth = row.length * nodeWidth + (row.length - 1) * gap;
    row.forEach((id, index) => positions.set(id, {
      x: (width - rowWidth) / 2 + index * (nodeWidth + gap),
      y: padding + level * (nodeHeight + rowGap),
    }));
  }
  return { width, height, nodeWidth, nodeHeight, positions };
}

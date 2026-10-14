"use client";

import { useEffect, useRef, useState } from "react";
import { layoutGraph } from "../lib/graph-layout";
import { getNodeResources, learningPath } from "../lib/planner";
import type { StudyPlan } from "../lib/types";

const graph = layoutGraph(learningPath);
const statusLabels = {
  "self-reported": "Familiar · self-reported", next: "Next step", ready: "Ready to learn",
  blocked: "Needs prerequisites", upcoming: "Coming up",
};

export default function RoadmapExplorer({ roadmap, onToggleFamiliar }: {
  roadmap: StudyPlan["roadmap"];
  onToggleFamiliar: (id: string) => void;
}) {
  const [selectedId, setSelectedId] = useState("c-essentials");
  const [query, setQuery] = useState("");
  const [viewPreference, setViewPreference] = useState<"graph" | "list" | null>(null);
  const [mobile, setMobile] = useState(false);
  const [zoom, setZoom] = useState(1);
  const viewport = useRef<HTMLDivElement>(null);
  const view = viewPreference ?? (mobile ? "list" : "graph");
  const selected = roadmap.find((node) => node.id === selectedId)!;
  const task = learningPath.tasks.find((task) => task.conceptId === selectedId)!;
  const sources = getNodeResources(selectedId);
  const prerequisites = learningPath.edges.filter((edge) => edge.to === selectedId && edge.relation === "prerequisite");
  const optional = learningPath.edges.filter((edge) => edge.to === selectedId && edge.relation === "useful_for");
  const parents = new Set(prerequisites.map((edge) => edge.from));
  const children = new Set(learningPath.edges.filter((edge) => edge.from === selectedId && edge.relation === "prerequisite").map((edge) => edge.to));
  const normalizedQuery = query.trim().toLowerCase();
  const matches = (node: StudyPlan["roadmap"][number]) => !normalizedQuery || `${node.title} ${node.description}`.toLowerCase().includes(normalizedQuery);
  const filtered = roadmap.filter(matches);
  const nodes = view === "list" ? filtered : roadmap;
  const familiarCount = roadmap.filter((node) => node.kind === "concept" && node.status === "self-reported").length;
  const remainingHours = learningPath.tasks.filter((candidate) =>
    roadmap.find((node) => node.id === candidate.conceptId)?.status !== "self-reported"
  ).reduce((sum, candidate) => sum + candidate.estimatedMinutes, 0) / 60;

  useEffect(() => {
    const media = window.matchMedia("(max-width: 720px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (view !== "graph" || !viewport.current) return;
    const element = viewport.current;
    let previousWidth = 0;
    const observer = new ResizeObserver(() => {
      // Zoom changes the canvas height too; only an actual width change should refit.
      if (element.clientWidth !== previousWidth) {
        previousWidth = element.clientWidth;
        setZoom(Math.min(1, previousWidth / graph.width));
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [view]);

  function nodeLabel(id: string) {
    return learningPath.nodes.find((node) => node.id === id)!.title;
  }

  function select(id: string) { setSelectedId(id); }
  function jumpToDetails() { document.getElementById("selected-step-title")?.focus(); }

  function nodeButton(node: StudyPlan["roadmap"][number], index: number) {
    const required = learningPath.edges.filter((edge) => edge.to === node.id && edge.relation === "prerequisite");
    return <>
      <button type="button" className={`graph-node ${node.status} ${parents.has(node.id) || children.has(node.id) ? "connected" : ""}`}
        aria-pressed={node.id === selectedId} aria-controls="step-details" aria-describedby={`dependency-${node.id}`}
        onFocus={(event) => event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" })}
        onClick={() => select(node.id)}>
        <span className="graph-node-top"><span>{node.kind === "project" ? "PROJECT" : `STEP ${String(index + 1).padStart(2, "0")}`}</span><span aria-hidden="true">{node.status === "self-reported" ? "✓" : node.kind === "project" ? "◇" : "○"}</span></span>
        <span className="graph-node-title">{node.title}</span>
        <span className="graph-node-status">{statusLabels[node.status]}</span>
      </button>
      {node.id === selectedId && <a className="node-details-shortcut" href="#selected-step-title" onClick={(event) => { event.preventDefault(); jumpToDetails(); }}>Read details for {node.title}</a>}
      <span className="sr-only" id={`dependency-${node.id}`}>{required.length ? `Requires ${required.map((edge) => nodeLabel(edge.from)).join(", ")}.` : "No hard prerequisites."}</span>
    </>;
  }

  return (
    <section id="full-roadmap" className="roadmap-section" aria-labelledby="full-roadmap-heading">
      <div className="roadmap-header">
        <div><p className="eyebrow">SEE HOW IT ALL CONNECTS</p><h2 id="full-roadmap-heading" tabIndex={-1}>Your whole roadmap</h2><p>Build a Hack assembler in C, from your first program to a tested project.</p></div>
        <div className="roadmap-summary"><strong>12 concepts <span>+ 1 project</span></strong><span>8 resources · {familiarCount} marked familiar</span><span>~{Number(remainingHours.toFixed(1))} hours remaining · estimates only</span></div>
      </div>
      <p className="sr-only" role="status">Selected step: {selected.title}. Use Read selected step details to move to its explanation.</p>

      <div className="roadmap-toolbar">
        <div className="view-switch" role="group" aria-label="Roadmap view">
          <button type="button" aria-pressed={view === "graph"} onClick={() => setViewPreference("graph")}><span aria-hidden="true">⌘</span> Graph</button>
          <button type="button" aria-pressed={view === "list"} onClick={() => setViewPreference("list")}><span aria-hidden="true">☷</span> List</button>
        </div>
        <button type="button" className="text-button details-jump" onClick={jumpToDetails}>Read selected step details</button>
        <div className="roadmap-search"><label className="sr-only" htmlFor="roadmap-search">Search roadmap</label><input id="roadmap-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a concept…"/><span className="sr-only" role="status">{filtered.length} of {roadmap.length} roadmap steps match.</span></div>
        {view === "graph" && <div className="zoom-controls" role="group" aria-label="Graph zoom">
          <button type="button" aria-label="Zoom out" disabled={zoom <= .25} onClick={() => setZoom((value) => Math.max(.25, value - .15))}>−</button>
          <span aria-live="polite">{Math.round(zoom * 100)}%</span>
          <button type="button" aria-label="Zoom in" disabled={zoom >= 1.5} onClick={() => setZoom((value) => Math.min(1.5, value + .15))}>+</button>
          <button type="button" onClick={() => setZoom(Math.min(1, (viewport.current?.clientWidth ?? graph.width) / graph.width))}>Fit</button>
        </div>}
      </div>

      <div className="explorer-layout">
        <div className="roadmap-map-area">
          <div className="graph-legend"><span><i className="legend-line"/> Required before</span><span><i className="legend-line optional"/> Helpful background</span><span className="legend-next"><i/> Next step</span></div>
          {normalizedQuery && <p className="search-summary">{filtered.length} of {roadmap.length} steps match. {view === "graph" && "The whole graph stays visible for context."} <button type="button" className="text-button" onClick={() => setQuery("")}>Clear search</button></p>}

          {view === "graph" ? (
            <div className="graph-viewport" ref={viewport} tabIndex={0} role="region" aria-label="Roadmap graph" aria-describedby="graph-instructions">
              <div className="graph-stage" style={{ width: graph.width * zoom, height: graph.height * zoom }}>
                <div className="graph-world" style={{ width: graph.width, height: graph.height, transform: `scale(${zoom})` }}>
                  <svg width={graph.width} height={graph.height} aria-hidden="true" className="dependency-edges">
                    <defs><marker id="dependency-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 10 5 0 10" fill="none" stroke="currentColor" strokeWidth="1.7"/></marker></defs>
                    {learningPath.edges.map((edge) => {
                      const start = graph.positions.get(edge.from)!;
                      const end = graph.positions.get(edge.to)!;
                      const x1 = start.x + graph.nodeWidth / 2;
                      const y1 = start.y + graph.nodeHeight;
                      const x2 = end.x + graph.nodeWidth / 2;
                      const y2 = end.y;
                      const middle = (y1 + y2) / 2;
                      return <path key={`${edge.from}-${edge.to}`} className={`dependency-edge ${edge.relation} ${edge.from === selectedId || edge.to === selectedId ? "highlighted" : ""}`} d={`M${x1} ${y1} C${x1} ${middle}, ${x2} ${middle}, ${x2} ${y2}`} markerEnd="url(#dependency-arrow)"/>;
                    })}
                  </svg>
                  <ol className="graph-nodes" aria-label="Learning roadmap">
                    {nodes.map((node) => { const index = roadmap.findIndex((item) => item.id === node.id); const position = graph.positions.get(node.id)!;
                      return <li key={node.id} className={!matches(node) ? "search-dimmed" : ""} style={{ left: position.x, top: position.y, width: graph.nodeWidth, height: graph.nodeHeight }}>{nodeButton(node, index)}</li>;
                    })}
                  </ol>
                </div>
              </div>
            </div>
          ) : (
            <ol className="outline-nodes" aria-label="Learning roadmap">
              {nodes.map((node) => <li key={node.id}>{nodeButton(node, roadmap.findIndex((item) => item.id === node.id))}</li>)}
            </ol>
          )}
          {view === "list" && !filtered.length && <p className="no-matches">No steps match your search. Try “symbols” or clear the search.</p>}
          <p className="graph-help" id="graph-instructions">Select any step to inspect it. Use Tab and Enter to explore; zoomed graphs can be scrolled with arrow keys. The list contains the same steps and details.</p>
        </div>

        <aside className="step-inspector" id="step-details" aria-labelledby="selected-step-title">
          <div className="inspector-content">
            <p className="eyebrow">STEP DETAILS</p>
            <h3 id="selected-step-title" tabIndex={-1}>{selected.title}</h3>
            <p className={`inspector-status ${selected.status}`}>{statusLabels[selected.status]}</p>
            <p className="concept-description">{selected.description}</p>
            <div className="inspector-block"><h4>Before this step</h4>{prerequisites.length ? <ul>{prerequisites.map((edge) => <li key={edge.from}><button type="button" className="dependency-link" onClick={() => select(edge.from)}>{nodeLabel(edge.from)} <span aria-hidden="true">↗</span></button></li>)}</ul> : <p>You can start here. No hard prerequisites.</p>}</div>
            {optional.length > 0 && <div className="inspector-block"><h4>Helpful, not required</h4><ul>{optional.map((edge) => <li key={edge.from}><button type="button" className="dependency-link" onClick={() => select(edge.from)}>{nodeLabel(edge.from)} <span aria-hidden="true">↗</span></button></li>)}</ul></div>}
            <div className="inspector-block"><h4>What to practise <span>~{task.estimatedMinutes} min</span></h4><p>{task.exercise}</p></div>
            <div className="inspector-block"><h4>Expected output</h4><p>{task.expectedOutput}</p></div>
            <div className="inspector-block"><h4>Why it matters</h4><p>{task.explanation}</p></div>
            <div className="inspector-block inspector-resources"><h4>Resources</h4><ul>{sources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a><span>{source.provider} · Internet required</span></li>)}</ul></div>
            {selected.kind === "concept" && <div className="familiar-action"><button type="button" className="secondary-button" onClick={() => onToggleFamiliar(selected.id)}>{selected.status === "self-reported" ? "Remove familiarity" : "I already know this"}</button><p>This records familiarity for this session, not assessed mastery.</p></div>}
            {selected.kind === "project" && <p className="project-note">This is your destination. Validate your own work against the reference; this app does not grade it.</p>}
          </div>
        </aside>
      </div>
    </section>
  );
}

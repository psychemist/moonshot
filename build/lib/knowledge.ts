export const knowledgeOptions = [
  { id: "python", label: "Python" },
  { id: "javascript", label: "JavaScript" },
  { id: "basic-calculus", label: "Basic calculus" },
  { id: "c-essentials", label: "C essentials" },
  { id: "text-parsing", label: "Text parsing" },
  { id: "binary-representation", label: "Binary representation" },
  { id: "hack-instructions", label: "Hack instructions" },
  { id: "c-strings", label: "C strings & arrays" },
  { id: "file-io", label: "File input & output" },
  { id: "instruction-encoding", label: "Instruction encoding" },
  { id: "symbol-tables", label: "Symbol tables" },
  { id: "two-pass-assembly", label: "Two-pass assembly" },
  { id: "error-handling", label: "Error handling" },
  { id: "testing", label: "Testing & comparison" },
  { id: "assembler-integration", label: "Assembling the pieces" },
] as const;

export type KnowledgeId = typeof knowledgeOptions[number]["id"];

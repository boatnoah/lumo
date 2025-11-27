export type PromptKind = "mcq" | "short_text" | "long_text" | "slide";

export type PromptRecord = {
  prompt_id: number;
  session_id: string | number;
  slide_index: number;
  kind: PromptKind;
  content: Record<string, unknown> | null;
  created_at?: string | null;
};

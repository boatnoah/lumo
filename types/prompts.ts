export type PromptKind = "mcq" | "short_text" | "long_text" | "slide";

export type McqContent = {
  question?: string;
  options?: string[];
  correctIndex?: number | null;
};

export type ShortTextContent = {
  prompt?: string;
  charLimit?: number | null;
};

export type LongTextContent = {
  prompt?: string;
  wordLimit?: number | null;
  rubricHint?: string;
};

export type SlideContent = {
  imageUrl?: string;
  sourcePdf?: string;
  page?: number;
  storagePath?: string;
};

export type PromptContent =
  | McqContent
  | ShortTextContent
  | LongTextContent
  | SlideContent;

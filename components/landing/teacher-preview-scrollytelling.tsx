"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { MousePointer2Icon } from "lucide-react";

import {
  TeacherLiveView,
  type TeacherAnswerRow,
  type TeacherChatMessage,
  type TeacherPromptRow,
  type TeacherSessionInfo,
} from "@/components/teacher-live-view";

const ease = [0.16, 1, 0.3, 1] as const;

const steps = [
  {
    title: "Review the lesson flow",
    description:
      "Start by scanning the prompt list and choosing the next interaction you want to run.",
    target: "preview-prompt-1",
    click: false,
  },
  {
    title: "Select a prompt",
    description:
      "Move to the multiple choice question and make it the focus of the room.",
    target: "preview-prompt-2",
    click: true,
  },
  {
    title: "Show it to students",
    description:
      "Bring the question live so everyone sees the same prompt at the same time.",
    target: "preview-show-button",
    click: true,
  },
  {
    title: "Open responses",
    description:
      "Unlock the prompt and start collecting answers as students respond in real time.",
    target: "preview-open-button",
    click: true,
  },
  {
    title: "Watch the room react",
    description:
      "See answers and chat appear together so you can decide what to do next.",
    target: "preview-chat-panel",
    click: false,
  },
] as const;

type Props = {
  session: TeacherSessionInfo;
  prompts: TeacherPromptRow[];
  answers: TeacherAnswerRow[];
  messages: TeacherChatMessage[];
};

export function TeacherPreviewScrollytelling({
  session,
  prompts,
  answers,
  messages,
}: Props) {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const previewFrameRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ x: 32, y: 160 });
  const [stickyTop, setStickyTop] = useState(80);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setProgress(latest);
  });

  // Smooth outro: the pinned preview fades + drifts up + shrinks slightly during
  // the final scroll range so the sticky release feels intentional instead of abrupt.
  const outroRange = [0.88, 0.985];
  const outroOpacity = useTransform(scrollYProgress, outroRange, [1, 0]);
  const outroY = useTransform(scrollYProgress, outroRange, [0, -48]);
  const outroScale = useTransform(scrollYProgress, outroRange, [1, 0.94]);
  const outroBlur = useTransform(
    scrollYProgress,
    outroRange,
    ["blur(0px)", "blur(6px)"],
  );

  const phase = reduceMotion ? steps.length - 1 : getPhase(progress);
  const activeStep = steps[phase];
  const demo = useMemo(
    () => buildDemoState({ phase, prompts, answers, messages }),
    [phase, prompts, answers, messages],
  );
  const mobileDemo = useMemo(
    () =>
      buildDemoState({
        phase: steps.length - 1,
        prompts,
        answers,
        messages,
      }),
    [prompts, answers, messages],
  );

  useEffect(() => {
    if (reduceMotion) return;

    const updateCursorPosition = () => {
      const frame = previewFrameRef.current;
      if (!frame) return;

      const target = frame.querySelector<HTMLElement>(
        `[data-demo-target="${activeStep.target}"]`,
      );

      if (!target) return;

      const frameRect = frame.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();

      setCursorPosition({
        x: targetRect.left - frameRect.left + targetRect.width / 2,
        y: targetRect.top - frameRect.top + targetRect.height / 2,
      });
    };

    const frame = previewFrameRef.current;
    const resizeObserver = new ResizeObserver(() => updateCursorPosition());
    if (frame) {
      resizeObserver.observe(frame);
    }

    const animationFrame = window.requestAnimationFrame(updateCursorPosition);
    window.addEventListener("resize", updateCursorPosition);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", updateCursorPosition);
      resizeObserver.disconnect();
    };
  }, [activeStep.target, demo, reduceMotion]);

  useEffect(() => {
    const updateStickyTop = () => {
      const sticky = stickyRef.current;
      if (!sticky || typeof window === "undefined") return;

      const height = sticky.getBoundingClientRect().height;
      const centeredTop = Math.max(24, Math.round(window.innerHeight / 2 - height / 2));
      setStickyTop(centeredTop);
    };

    const sticky = stickyRef.current;
    const resizeObserver = new ResizeObserver(() => updateStickyTop());
    if (sticky) {
      resizeObserver.observe(sticky);
    }

    const animationFrame = window.requestAnimationFrame(updateStickyTop);
    window.addEventListener("resize", updateStickyTop);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", updateStickyTop);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <section ref={sectionRef} className="px-4 pb-20 pt-14 sm:px-6 sm:pb-28 sm:pt-16">
      <div className="mx-auto hidden max-w-7xl lg:block lg:min-h-[280vh]">
        <div ref={stickyRef} className="sticky" style={{ top: `${stickyTop}px` }}>
          <motion.div
            style={
              reduceMotion
                ? undefined
                : {
                    opacity: outroOpacity,
                    y: outroY,
                    scale: outroScale,
                    filter: outroBlur,
                  }
            }
            className="relative overflow-hidden rounded-[40px] border border-border/70 bg-[radial-gradient(circle_at_top,_rgba(53,196,120,0.08),_transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.58))] p-5 shadow-[0_30px_120px_rgba(24,48,34,0.12)] sm:p-6"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_45%,_rgba(24,48,34,0.06)_100%)]" />
            <motion.div
              ref={previewFrameRef}
              initial={
                reduceMotion
                  ? { opacity: 1 }
                  : { opacity: 0, y: 30, scale: 0.98, filter: "blur(10px)" }
              }
              whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1.4, ease }}
              className="relative overflow-hidden rounded-[32px] border border-border/80 bg-card shadow-[0_18px_50px_rgba(24,48,34,0.08)]"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep.title}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 1, ease }}
                  className="pointer-events-none absolute inset-x-0 top-8 z-30 flex justify-center px-6 sm:top-10"
                >
                  <div className="max-w-lg rounded-full border border-border/80 bg-background/92 px-4 py-2 text-center shadow-lg backdrop-blur">
                    <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Live preview
                    </span>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {activeStep.title}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              <TeacherLiveView
                session={session}
                sessionStatus="live"
                channelReady
                prompts={demo.prompts}
                selectedPromptId={demo.selectedPromptId}
                currentPromptId={demo.currentPromptId}
                selectedPrompt={demo.selectedPrompt}
                currentPrompt={demo.currentPrompt}
                answers={demo.answers}
                answersLoading={false}
                messages={demo.messages}
                chatInput=""
                className="min-h-0 bg-transparent px-4 py-5 pt-16 sm:px-5 sm:py-6 sm:pt-16"
                demoTargetPrefix="preview"
                readOnly
              />

              {!reduceMotion ? (
                <motion.div
                  className="pointer-events-none absolute left-0 top-0 z-20 -translate-x-1/2 -translate-y-1/2"
                  animate={{
                    x: cursorPosition.x,
                    y: cursorPosition.y,
                  }}
                  transition={{ duration: 1.85, ease }}
                >
                  {activeStep.click ? (
                    <motion.div
                      key={`pulse-${phase}`}
                      initial={{ scale: 0.65, opacity: 0 }}
                      animate={{ scale: [0.9, 1.18, 1.28], opacity: [0, 0.18, 0] }}
                      transition={{ duration: 1, ease }}
                      className="absolute left-1/2 top-1/2 h-9 w-9 -translate-x-[35%] -translate-y-[35%] rounded-full border border-primary/35 bg-primary/10"
                    />
                  ) : null}
                  <motion.div
                    key={`cursor-${phase}`}
                    initial={{ scale: 1 }}
                    animate={activeStep.click ? { scale: [1, 0.94, 1] } : { scale: 1 }}
                    transition={{ duration: 0.42, ease }}
                    className="drop-shadow-[0_10px_18px_rgba(24,48,34,0.22)]"
                  >
                    <MousePointer2Icon className="h-6 w-6 -rotate-12 fill-background stroke-[2.2] text-foreground" />
                  </motion.div>
                </motion.div>
              ) : null}
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl overflow-hidden rounded-[32px] border border-border/80 bg-card shadow-[0_18px_50px_rgba(24,48,34,0.08)] lg:hidden">
        <TeacherLiveView
          session={session}
          sessionStatus="live"
          channelReady
          prompts={mobileDemo.prompts}
          selectedPromptId={mobileDemo.selectedPromptId}
          currentPromptId={mobileDemo.currentPromptId}
          selectedPrompt={mobileDemo.selectedPrompt}
          currentPrompt={mobileDemo.currentPrompt}
          answers={mobileDemo.answers}
          answersLoading={false}
          messages={mobileDemo.messages}
          chatInput=""
          className="min-h-0 bg-transparent px-4 py-5 sm:px-5 sm:py-6"
          demoTargetPrefix="preview"
          readOnly
        />
      </div>
    </section>
  );
}

function getPhase(progress: number) {
  if (progress < 0.58) return 0;
  if (progress < 0.7) return 1;
  if (progress < 0.8) return 2;
  if (progress < 0.88) return 3;
  return 4;
}

function buildDemoState({
  phase,
  prompts,
  answers,
  messages,
}: {
  phase: number;
  prompts: TeacherPromptRow[];
  answers: TeacherAnswerRow[];
  messages: TeacherChatMessage[];
}) {
  const basePrompts = prompts.map((prompt) => ({
    ...prompt,
    is_open: false,
  }));

  const selectedPromptId = phase >= 1 ? 2 : 1;
  const currentPromptId = phase >= 2 ? 2 : null;

  const nextPrompts = basePrompts.map((prompt) => {
    if (prompt.prompt_id === 2 && phase >= 3) {
      return { ...prompt, is_open: true, released: true };
    }
    if (prompt.prompt_id === 2 && phase >= 2) {
      return { ...prompt, released: true };
    }
    return prompt;
  });

  const selectedPrompt = nextPrompts.find((prompt) => prompt.prompt_id === selectedPromptId) ?? null;
  const currentPrompt = nextPrompts.find((prompt) => prompt.prompt_id === currentPromptId) ?? null;

  return {
    prompts: nextPrompts,
    selectedPromptId,
    currentPromptId,
    selectedPrompt,
    currentPrompt,
    answers: phase >= 4 ? answers : phase >= 3 ? answers.slice(0, 1) : [],
    messages: phase >= 4 ? messages : phase >= 3 ? messages.slice(0, 1) : [],
  };
}

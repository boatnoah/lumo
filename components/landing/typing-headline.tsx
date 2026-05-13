"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function TypingHeadline({
  text,
  className,
  speed = 52,
  startDelay = 380,
}: {
  text: string;
  className?: string;
  speed?: number;
  startDelay?: number;
}) {
  const reduceMotion = useReducedMotion();
  const [displayed, setDisplayed] = useState(reduceMotion ? text : "");

  useEffect(() => {
    if (reduceMotion) {
      setDisplayed(text);
      return;
    }

    setDisplayed("");
    let index = 0;
    let intervalId: number | undefined;
    const timeoutId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        index += 1;
        setDisplayed(text.slice(0, index));

        if (index >= text.length) {
          if (intervalId) {
            window.clearInterval(intervalId);
          }
        }
      }, speed);
    }, startDelay);

    return () => {
      window.clearTimeout(timeoutId);
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [reduceMotion, speed, startDelay, text]);

  return (
    <div className="relative">
      <h1 className={className} aria-hidden="true" style={{ visibility: "hidden" }}>
        {text}
      </h1>
      <h1 className={`${className} absolute inset-0`} aria-label={text}>
        <span>{displayed}</span>
        {!reduceMotion ? (
          <motion.span
            aria-hidden="true"
            className="ml-1 inline-block align-baseline text-primary"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          >
            |
          </motion.span>
        ) : null}
      </h1>
    </div>
  );
}

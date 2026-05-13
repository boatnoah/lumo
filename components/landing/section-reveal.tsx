"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;
const viewport = { once: true, margin: "-80px" };

export function SectionReveal({
  children,
  className,
  delay = 0,
  y = 24,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease, delay }}
      viewport={viewport}
    >
      {children}
    </motion.div>
  );
}

export function StaggerReveal({
  children,
  className,
  delayChildren = 0,
  staggerChildren = 0.22,
}: {
  children: ReactNode;
  className?: string;
  delayChildren?: number;
  staggerChildren?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={{
        hidden: {},
        visible: {
          transition: reduceMotion
            ? undefined
            : { delayChildren, staggerChildren },
        },
      }}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  y = 20,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={{
        hidden: reduceMotion ? { opacity: 0 } : { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 1.05, ease },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function PreviewReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={
        reduceMotion
          ? { opacity: 0 }
          : {
              opacity: 0,
              y: 30,
              scale: 0.975,
              clipPath: "inset(0 0 100% 0 round 32px)",
              filter: "blur(10px)",
            }
      }
      whileInView={{
        opacity: 1,
        y: 0,
        scale: 1,
        clipPath: "inset(0 0 0% 0 round 32px)",
        filter: "blur(0px)",
      }}
      transition={{ duration: 1.6, ease }}
      viewport={viewport}
    >
      {children}
    </motion.div>
  );
}

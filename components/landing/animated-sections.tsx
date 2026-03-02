"use client";

import { Children, ReactNode, useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const ease = [0.16, 1, 0.3, 1] as const;
const viewport = { once: true, margin: "-80px" };

/* ─── Animated wrapper for the 3-column feature cards grid ─── */

export function AnimatedFeatureCards({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);
  return (
    <div className="grid md:grid-cols-3 gap-8 lg:gap-12 mb-32">
      {items.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: i * 0.1 }}
          viewport={viewport}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Animated wrapper for the stats section ─── */

export function AnimatedStats({
  heading,
  children,
}: {
  heading: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="max-w-5xl mx-auto text-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        viewport={viewport}
      >
        {heading}
      </motion.div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {Children.toArray(children).map((child, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: i * 0.1 }}
            viewport={viewport}
          >
            {child}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── CountUp: animates a numeric value from 0 when scrolled into view ─── */

export function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  // Extract leading number and trailing text (e.g. "4+" → num=4, suffix="+")
  const match = value.match(/^(\d+)(.*)$/);
  const isNumeric = !!match;
  const target = isNumeric ? parseInt(match![1], 10) : 0;
  const suffix = isNumeric ? match![2] : "";

  const [display, setDisplay] = useState(isNumeric ? "0" + suffix : value);

  useEffect(() => {
    if (!isInView || !isNumeric) return;

    const duration = 1000; // ms
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      setDisplay(current + suffix);

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }, [isInView, isNumeric, target, suffix]);

  if (!isNumeric) {
    // Non-numeric values just fade in
    return (
      <motion.span
        ref={ref}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6, ease }}
        viewport={{ once: true, margin: "-80px" }}
        className="text-3xl font-bold mb-2 block"
      >
        {value}
      </motion.span>
    );
  }

  return (
    <span ref={ref} className="text-3xl font-bold mb-2 block">
      {display}
    </span>
  );
}

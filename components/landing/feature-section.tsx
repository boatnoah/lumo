"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const ease = [0.16, 1, 0.3, 1] as const;
const viewport = { once: true, margin: "-80px" };

type FeatureSectionProps = {
  title: string;
  description: string;
  imagePosition?: "left" | "right";
  children?: ReactNode;
  className?: string;
};

export function FeatureSection({
  title,
  description,
  imagePosition = "right",
  children,
  className,
}: FeatureSectionProps) {
  return (
    <section className={cn("py-20 sm:py-24 lg:py-32 px-4 sm:px-6", className)}>
      <div className="max-w-7xl mx-auto">
        <div className={cn(
          "grid lg:grid-cols-2 gap-12 lg:gap-20 items-center",
          imagePosition === "left" && "lg:grid-flow-dense"
        )}>
          {/* Text Content */}
          <motion.div
            className={cn(
              "space-y-6 lg:space-y-8",
              imagePosition === "left" && "lg:col-start-2"
            )}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            viewport={viewport}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight">
              {title}
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed font-light max-w-xl">
              {description}
            </p>
          </motion.div>
          
          {/* Visual Content */}
          <motion.div
            className={cn(
              "relative",
              imagePosition === "left" && "lg:col-start-1 lg:row-start-1"
            )}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.15 }}
            viewport={viewport}
          >
            {children || (
              <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-muted/50 to-muted shadow-xl border border-border/50" />
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

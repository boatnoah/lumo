"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const ease = [0.16, 1, 0.3, 1] as const;
const viewport = { once: true, margin: "-80px" };

export function FinalCTA() {
  return (
    <section className="relative py-24 sm:py-32 lg:py-40 px-4 sm:px-6 overflow-hidden">
      {/* Inverted background for contrast */}
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/95 via-foreground to-foreground/95" />
      
      {/* Subtle animated glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDuration: '6s' }} />
      
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8 sm:space-y-10">
        <motion.h2
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-background leading-tight"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          viewport={viewport}
        >
          Ready to transform
          <br />
          your classroom?
        </motion.h2>
        
        <motion.p
          className="text-lg sm:text-xl text-background/70 max-w-2xl mx-auto font-light"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.1 }}
          viewport={viewport}
        >
          Join educators worldwide making every lesson interactive and inclusive.
        </motion.p>
        
        <motion.div
          className="pt-2"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.2 }}
          viewport={viewport}
        >
          <Button 
            asChild 
            size="lg" 
            className="text-base sm:text-lg px-10 sm:px-12 py-5 sm:py-6 rounded-full bg-background text-foreground hover:bg-background/90 shadow-2xl hover:shadow-3xl transition-all duration-300 min-w-[220px]"
          >
            <Link href="/auth/sign-up">Get Started Free</Link>
          </Button>
        </motion.div>
        
        <motion.p
          className="text-sm text-background/60 font-light"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, ease, delay: 0.3 }}
          viewport={viewport}
        >
          No credit card required
        </motion.p>
      </div>
    </section>
  );
}

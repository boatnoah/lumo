"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FinalCTA() {
  return (
    <section className="relative py-24 sm:py-32 lg:py-40 px-4 sm:px-6 overflow-hidden">
      {/* Inverted background for contrast */}
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/95 via-foreground to-foreground/95 dark:from-background dark:via-muted/5 dark:to-background" />
      
      {/* Subtle animated glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDuration: '6s' }} />
      
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8 sm:space-y-10">
        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-background dark:text-foreground leading-[1.1]">
          Ready to transform
          <br />
          your classroom?
        </h2>
        
        <p className="text-lg sm:text-xl text-background/70 dark:text-muted-foreground max-w-2xl mx-auto font-light">
          Join educators worldwide making every lesson interactive and inclusive.
        </p>
        
        <div className="pt-2">
          <Button 
            asChild 
            size="lg" 
            className="text-base sm:text-lg px-10 sm:px-12 py-5 sm:py-6 rounded-full bg-background text-foreground hover:bg-background/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 shadow-2xl hover:shadow-3xl transition-all duration-300 min-w-[220px]"
          >
            <Link href="/auth/sign-up">Get Started Free</Link>
          </Button>
        </div>
        
        <p className="text-sm text-background/60 dark:text-muted-foreground font-light">
          No credit card required
        </p>
      </div>
    </section>
  );
}


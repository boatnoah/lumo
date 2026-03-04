"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const ease = [0.16, 1, 0.3, 1] as const;

export function HeroSection() {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center px-4 sm:px-6 overflow-hidden">
      {/* Simplified gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/20" />
      
      {/* Subtle animated orbs */}
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl opacity-60 animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl opacity-60 animate-pulse" style={{ animationDuration: '12s' }} />
      
      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
        {/* Logo or Icon */}
        <motion.div
          className="flex justify-center mb-4"
          initial={{ opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease }}
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center backdrop-blur-sm border border-primary/10">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/80" />
          </div>
        </motion.div>

        <motion.h1
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight leading-tight mb-6"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.1 }}
        >
          Transform your
          <br />
          classroom
        </motion.h1>
        
        <motion.p
          className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.2 }}
        >
          Real-time engagement that empowers every voice.
          <br className="hidden sm:block" />
          Interactive, inclusive, and insightful.
        </motion.p>
        
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.3 }}
        >
          <Button 
            asChild 
            size="lg" 
            className="text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 min-w-[200px]"
          >
            <Link href="/auth/sign-up">Get Started</Link>
          </Button>
          
          <Button 
            asChild 
            size="lg" 
            variant="ghost"
            className="text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-6 rounded-full transition-all duration-300 min-w-[200px] hover:bg-muted/50"
          >
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

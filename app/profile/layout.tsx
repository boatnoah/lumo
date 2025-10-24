import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <div className="h-2 w-full bg-muted rounded-full">
          {/* You can set width via children pages (step 1: 50%, step 2: 100%) */}
          {/* For simplicity, each page renders its own progress bar */}
        </div>
      </div>
      {children}
    </main>
  );
}

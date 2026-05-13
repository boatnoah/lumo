import { QuoteIcon } from "lucide-react";

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  initials: string;
  avatarClass: string;
};

const testimonials: Testimonial[] = [
  {
    quote:
      "The first tool I've used where my quietest students are the ones moving the discussion forward. Anonymous responses changed everything.",
    name: "Sarah Martinez",
    role: "9th-grade Biology, Austin ISD",
    initials: "SM",
    avatarClass: "bg-accent-1/25",
  },
  {
    quote:
      "I import my slides, drop in MCQs, and in ten minutes I have a live room. Setup used to take me an hour before class.",
    name: "James Okafor",
    role: "Math & CS, Millbrook Academy",
    initials: "JO",
    avatarClass: "bg-accent-2/30",
  },
  {
    quote:
      "Live analytics mean I stop losing the room. I can see who's lost and pivot before the bell — not after grading on Sunday.",
    name: "Aisha Patel",
    role: "AP History, Lincoln High",
    initials: "AP",
    avatarClass: "bg-accent-3/25",
  },
];

export function Testimonials() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mx-auto mb-16 max-w-3xl text-center sm:mb-20">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">
          Loved in classrooms
        </p>
        <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          What teachers are saying
        </h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        {testimonials.map((t) => (
          <figure
            key={t.name}
            className="relative flex h-full flex-col rounded-3xl border border-border/60 bg-card p-8 shadow-[0_1px_0_0_rgba(24,48,34,0.04),0_18px_40px_-24px_rgba(24,48,34,0.15)]"
          >
            <QuoteIcon className="h-7 w-7 text-primary/40" aria-hidden />
            <blockquote className="mt-5 flex-1 text-lg leading-relaxed text-foreground/90">
              {t.quote}
            </blockquote>
            <figcaption className="mt-8 flex items-center gap-3">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-foreground ${t.avatarClass}`}
                aria-hidden
              >
                {t.initials}
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">{t.name}</span>
                <span className="text-xs text-muted-foreground">{t.role}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

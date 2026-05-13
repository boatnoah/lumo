import Link from "next/link";

type FooterColumn = {
  heading: string;
  links: { label: string; href: string }[];
};

const columns: FooterColumn[] = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#teachers" },
      { label: "For students", href: "#students" },
      { label: "Insights", href: "#insights" },
      { label: "Pricing", href: "#" },
    ],
  },
  {
    heading: "For educators",
    links: [
      { label: "Getting started", href: "#" },
      { label: "Lesson templates", href: "#" },
      { label: "Classroom guides", href: "#" },
      { label: "Community", href: "#" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Press", href: "#" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Security", href: "#" },
      { label: "Accessibility", href: "#" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-20 sm:px-6 lg:pb-12 lg:pt-24">
        <div className="grid gap-12 lg:grid-cols-[1.3fr,2fr] lg:gap-16">
          <div className="max-w-sm">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-semibold tracking-tight"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-sm">
                <span className="h-3 w-3 rounded-[3px] bg-background/95" />
              </span>
              Lumo
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Real-time engagement that makes every voice in the room part of
              the lesson.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {columns.map((col) => (
              <div key={col.heading}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
                  {col.heading}
                </h3>
                <ul className="mt-4 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col-reverse gap-4 border-t border-border/60 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Lumo. Built with care for classrooms.
          </p>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="/auth/login" className="transition-colors hover:text-foreground">
              Sign in
            </Link>
            <Link
              href="/auth/sign-up"
              className="transition-colors hover:text-foreground"
            >
              Get started
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

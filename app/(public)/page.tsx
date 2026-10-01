import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  Bot,
  LayoutDashboard,
  ListChecks,
  LogIn,
  MessageSquare,
  UsersRound,
} from "lucide-react";
import LandingProductPreview from "@/components/public/LandingProductPreview";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Team collaboration, made clearer",
  description:
    "Bring team conversations, tasks, AI assistance, and workspace activity together with Brainiacs.",
};

const features: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: "Team communication",
    description:
      "Keep conversations close to the projects and decisions they move forward.",
    icon: MessageSquare,
  },
  {
    title: "Organized workspaces",
    description:
      "Bring channels, team updates, and quick polls together around shared work.",
    icon: LayoutDashboard,
  },
  {
    title: "AI assistance",
    description:
      "Get a hand brainstorming, drafting, or breaking a big task into steps.",
    icon: Bot,
  },
  {
    title: "Task management",
    description:
      "Make progress visible with flexible boards, clear ownership, and milestones.",
    icon: ListChecks,
  },
];

const workflow: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: "Create or join a workspace",
    description: "Set up a board for your team or join one you're invited to.",
    icon: UsersRound,
  },
  {
    title: "Communicate with your team",
    description: "Keep project conversations and decisions in the right channel.",
    icon: MessageSquare,
  },
  {
    title: "Organize tasks and work",
    description: "Turn plans into tasks and follow progress across your board.",
    icon: ListChecks,
  },
  {
    title: "Use AI when you need it",
    description: "Bring Brainiacs AI into the process when a little help goes far.",
    icon: Bot,
  },
];

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const entryHref = user ? "/dashboard" : "/signup";

  return (
    <>
      <section className="bg-foreground text-background">
        <div className="landing-enter mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-background/20 bg-background/10 px-3 py-1.5 text-xs font-semibold uppercase text-background sm:text-sm">
            <Activity aria-hidden="true" className="h-4 w-4 text-primary" />
            Modern Team Collaboration
          </p>
          <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-bold text-background sm:text-5xl lg:text-6xl">
            Bring your team&apos;s work together.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-background/75 sm:text-lg sm:leading-8">
            Brainiacs is a modern collaboration workspace for team conversations,
            tasks, AI assistance, and the progress that connects them.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={entryHref}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-background"
            >
              {user ? "Open Dashboard" : "Get Started"}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            {user ? (
              <a
                href="#features"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-background/25 px-6 text-sm font-semibold text-background transition-colors hover:bg-background/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-background"
              >
                Explore Features
              </a>
            ) : (
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-background/25 px-6 text-sm font-semibold text-background transition-colors hover:bg-background/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-background"
              >
                <LogIn aria-hidden="true" className="h-4 w-4" />
                Sign In
              </Link>
            )}
          </div>
          <p className="mt-5 text-xs text-background/60">
            One shared place for the conversations and work that move teams forward.
          </p>
        </div>
      </section>

      <LandingProductPreview />

      <section id="features" className="scroll-mt-8 bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-primary">Why Brainiacs</p>
            <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
              Less scattered work. More shared momentum.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted">
              Give your team a calm place to coordinate, make progress, and stay
              connected to the bigger picture.
            </p>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-xl border bg-background p-5 transition-colors hover:bg-surface-hover"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-base font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-primary">How it works</p>
            <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
              A natural rhythm for team work
            </h2>
          </div>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {workflow.map((step, index) => (
              <li key={step.title} className="relative rounded-xl border bg-surface p-5">
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <step.icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-muted">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-primary">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center lg:px-8 lg:py-16">
          <div>
            <p className="text-sm font-semibold text-primary-foreground/75">
              Make good work easier to do together
            </p>
            <h2 className="mt-2 text-3xl font-bold text-primary-foreground sm:text-4xl">
              Bring your team&apos;s work together.
            </h2>
          </div>
          <Link
            href={entryHref}
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-surface px-5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-foreground"
          >
            {user ? "Open Dashboard" : "Get Started"}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

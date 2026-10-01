import Link from "next/link";

const FEATURES = [
  {
    title: "Kanban boards",
    text: "Create columns and tasks, drag them around and see changes from your teammates instantly.",
  },
  {
    title: "Team chat",
    text: "Every board has its own chat with replies, reactions, pinned messages and file sharing.",
  },
  {
    title: "Polls",
    text: "Settle decisions quickly by creating a poll right inside the board chat.",
  },
  {
    title: "Leaderboard",
    text: "Complete tasks to earn points and see who is leading the team.",
  },
  {
    title: "Activity log",
    text: "A clear history of what changed on your boards, who did it and when.",
  },
  {
    title: "AI assistant",
    text: "Get help breaking down projects, drafting messages and brainstorming ideas.",
  },
];

const STEPS = [
  {
    title: "Create a board",
    text: "Start with a name, a color and a few columns such as To do, In progress and Done.",
  },
  {
    title: "Invite your team",
    text: "Search for teammates by name or email. They accept the invite and join right away.",
  },
  {
    title: "Get things done",
    text: "Move tasks across columns, chat about them and earn points as you finish work.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Plan, chat and ship together
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
          Brainiacs brings your team&apos;s tasks, conversations and progress
          into one simple workspace, updated live for everyone.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Get started free
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-border px-6 py-3 font-medium text-foreground hover:bg-surface-hover"
          >
            See pricing
          </Link>
        </div>
      </section>

      <section className="border-y bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center text-3xl font-bold text-foreground">
            Everything your team needs
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border bg-background p-6"
              >
                <h3 className="text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-3xl font-bold text-foreground">
          How it works
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.title} className="text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                {index + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-muted">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="rounded-2xl bg-primary p-10 text-center">
          <h2 className="text-2xl font-bold text-primary-foreground">
            Ready to bring your team together?
          </h2>
          <Link
            href="/signup"
            className="mt-6 inline-block rounded-lg bg-surface px-6 py-3 font-medium text-foreground hover:bg-surface-hover"
          >
            Create your free account
          </Link>
        </div>
      </section>
    </>
  );
}

import {
  Activity,
  Bot,
  Check,
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  UsersRound,
} from "lucide-react";

export default function LandingProductPreview() {
  return (
    <section
      aria-labelledby="preview-title"
      className="bg-surface-muted py-14 sm:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <p className="text-sm font-semibold text-primary">A clearer way to work</p>
          <h2
            id="preview-title"
            className="mt-2 text-3xl font-bold text-foreground sm:text-4xl"
          >
            Your team&apos;s work, in context
          </h2>
          <p className="mt-3 text-base leading-7 text-muted">
            Conversations, tasks, and team momentum live together without
            competing for your attention.
          </p>
        </div>

        <div className="landing-preview-enter overflow-hidden rounded-2xl border bg-surface shadow-xl shadow-foreground/10">
          <div className="flex h-11 items-center gap-2 border-b bg-surface px-4">
            <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-primary/50" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
            <span className="ml-3 hidden text-xs text-muted sm:block">
              brainiacs.app / sample workspace
            </span>
          </div>

          <div className="grid min-h-[28rem] md:grid-cols-[12rem_minmax(0,1fr)]">
            <aside className="hidden border-r bg-surface p-4 md:block">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <LayoutDashboard aria-hidden="true" className="h-4 w-4" />
                </span>
                Your workspace
              </div>
              <div className="mt-7 space-y-5 text-xs">
                <div>
                  <p className="mb-2 font-semibold uppercase text-muted">Workspace</p>
                  <p className="flex items-center gap-2 rounded-md bg-surface-muted px-2 py-2 font-medium text-foreground">
                    <MessageSquare aria-hidden="true" className="h-3.5 w-3.5" />
                    Channels
                  </p>
                  <p className="mt-1 flex items-center gap-2 px-2 py-2 text-muted">
                    <UsersRound aria-hidden="true" className="h-3.5 w-3.5" />
                    Team members
                  </p>
                </div>
                <div>
                  <p className="mb-2 font-semibold uppercase text-muted">Channels</p>
                  <p className="rounded-md px-2 py-2 text-muted"># product-launch</p>
                  <p className="rounded-md px-2 py-2 text-muted"># research</p>
                  <p className="rounded-md px-2 py-2 text-muted"># team-updates</p>
                </div>
              </div>
            </aside>

            <div className="min-w-0 p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                <div className="min-w-0">
                  <p className="text-xs text-muted">Channel / Product</p>
                  <h3 className="mt-1 truncate text-lg font-semibold text-foreground">
                    Product launch
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <UsersRound aria-hidden="true" className="h-4 w-4" />
                  <span>Team members</span>
                </div>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(14rem,.8fr)]">
                <div className="space-y-5">
                  <section aria-label="Team conversation">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <MessageSquare aria-hidden="true" className="h-4 w-4 text-primary" />
                      Team conversation
                    </div>
                    <div className="space-y-3 rounded-xl border bg-background p-4">
                      <PreviewMessage
                        initials="PL"
                        name="Project lead"
                        time="10:24"
                        text="The first draft is ready for feedback. I&apos;ve added the key milestones to the board."
                      />
                      <PreviewMessage
                        initials="PD"
                        name="Product designer"
                        time="10:31"
                        text="Great. I&apos;ll review the launch checklist this afternoon."
                      />
                    </div>
                  </section>

                  <section aria-label="Kanban task preview">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Check aria-hidden="true" className="h-4 w-4 text-primary" />
                        Launch tasks
                      </div>
                      <span className="text-xs text-muted">Task status</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <PreviewColumn
                        title="To do"
                        tasks={["Review onboarding", "Draft announcement"]}
                      />
                      <PreviewColumn
                        title="In progress"
                        tasks={["Landing page", "Product walkthrough"]}
                      />
                      <PreviewColumn
                        title="Done"
                        tasks={["Set launch date"]}
                        className="hidden sm:block"
                      />
                    </div>
                  </section>
                </div>

                <div className="space-y-4">
                  <section className="rounded-xl border bg-background p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Bot aria-hidden="true" className="h-4 w-4 text-primary" />
                      Brainiacs AI
                    </div>
                    <p className="mt-3 rounded-lg bg-surface-muted p-3 text-xs leading-5 text-muted">
                      Turn this launch plan into a short checklist for the team.
                    </p>
                    <p className="mt-3 flex items-center gap-2 text-xs font-medium text-primary">
                      <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
                      Ready when you are
                    </p>
                  </section>

                  <section className="rounded-xl border bg-background p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Activity aria-hidden="true" className="h-4 w-4 text-primary" />
                      Recent activity
                    </div>
                    <ul className="mt-3 space-y-3 text-xs text-muted">
                      <li>Landing page moved to In progress</li>
                      <li>A teammate joined Product launch</li>
                      <li>Milestone checklist was updated</li>
                    </ul>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <PreviewPillar icon={MessageSquare} label="Team communication" />
          <PreviewPillar icon={UsersRound} label="Channels" />
          <PreviewPillar icon={Bot} label="AI assistance" />
          <PreviewPillar icon={Check} label="Tasks & Kanban" />
          <PreviewPillar icon={Activity} label="Activity" />
          <PreviewPillar icon={LayoutDashboard} label="Team workspace" />
        </div>
      </div>
    </section>
  );
}

function PreviewMessage({
  initials,
  name,
  time,
  text,
}: {
  initials: string;
  name: string;
  time: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-foreground">
          {name} <span className="ml-1 font-normal text-muted">{time}</span>
        </p>
        <p className="mt-1 text-xs leading-5 text-muted">{text}</p>
      </div>
    </div>
  );
}

function PreviewColumn({
  title,
  tasks,
  className = "",
}: {
  title: string;
  tasks: string[];
  className?: string;
}) {
  return (
    <div className={`min-w-0 rounded-lg bg-surface-muted p-2.5 ${className}`}>
      <p className="mb-2 truncate text-[11px] font-semibold text-foreground">
        {title}
      </p>
      <ul className="space-y-2">
        {tasks.map((task) => (
          <li
            key={task}
            className="rounded-md border bg-surface px-2 py-2 text-[10px] leading-4 text-muted"
          >
            {task}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PreviewPillar({
  icon: Icon,
  label,
}: {
  icon: typeof MessageSquare;
  label: string;
}) {
  return (
    <div className="flex min-h-12 items-center gap-2 rounded-lg border bg-surface px-3 py-2 text-xs font-medium text-foreground">
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-primary" />
      <span>{label}</span>
    </div>
  );
}
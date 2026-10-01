export const metadata = { title: "FAQ" };

const FAQS = [
  {
    q: "What is Brainiacs?",
    a: "Brainiacs is a team workspace with Kanban boards, per-board chat, polls, a leaderboard, an activity log and an AI assistant.",
  },
  {
    q: "How do I invite teammates to a board?",
    a: "Open the board, click Members, search for a person by name or email and send an invite. They accept it from the Invites menu at the top of their dashboard.",
  },
  {
    q: "How do points and the leaderboard work?",
    a: "Each task you mark as done earns you 1 point. The leaderboard ranks everyone by their total points.",
  },
  {
    q: "Who can see my board, tasks and chat?",
    a: "Only the members of a board can see its columns, tasks, chat messages, polls and files.",
  },
  {
    q: "Can I sign in with Google?",
    a: "Yes. You can create an account with an email and password, or continue with your Google account.",
  },
  {
    q: "What can the AI assistant do?",
    a: "It can help you break projects into tasks, draft or rewrite messages, brainstorm ideas and summarize text. It replies in the language you write in.",
  },
  {
    q: "How is my data protected?",
    a: "Every table in our database is protected with row level security, so people can only read or change the data they are allowed to access.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-bold text-foreground">
        Frequently asked questions
      </h1>

      <div className="mt-10 space-y-3">
        {FAQS.map((item) => (
          <details
            key={item.q}
            className="group rounded-xl border bg-surface p-4"
          >
            <summary className="cursor-pointer list-none font-medium text-foreground">
              <span className="flex items-center justify-between gap-3">
                {item.q}
                <span className="text-muted transition group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <p className="mt-3 text-sm text-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

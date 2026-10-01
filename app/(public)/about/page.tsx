export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-bold text-foreground">About Brainiacs</h1>

      <p className="mt-6 text-lg text-muted">
        Brainiacs is a team collaboration app built to keep planning, talking
        and tracking progress in a single place, so teams spend less time
        switching between tools.
      </p>

      <h2 className="mt-10 text-2xl font-semibold text-foreground">
        What we believe
      </h2>
      <ul className="mt-4 space-y-3 text-muted">
        <li>
          <span className="font-medium text-foreground">
            Simple beats complex.
          </span>{" "}
          A board, a chat and a clear list of tasks are enough for most teams.
        </li>
        <li>
          <span className="font-medium text-foreground">Live by default.</span>{" "}
          When a teammate moves a task or sends a message, you see it instantly.
        </li>
        <li>
          <span className="font-medium text-foreground">
            Your data stays yours.
          </span>{" "}
          Only the members of a board can see its tasks, chat and files.
        </li>
      </ul>

      <h2 className="mt-10 text-2xl font-semibold text-foreground">
        Built with
      </h2>
      <p className="mt-4 text-muted">
        Next.js and Tailwind CSS on the front end, Supabase for authentication,
        database, realtime updates and file storage, and an AI assistant powered
        by Groq.
      </p>
    </div>
  );
}

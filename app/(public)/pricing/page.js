import Link from "next/link";

export const metadata = { title: "Pricing" };

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For individuals and small teams getting started.",
    features: [
      "Up to 3 boards",
      "Kanban boards and tasks",
      "Board chat and polls",
      "Leaderboard and activity log",
    ],
    cta: "Get started",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "per user / month",
    description: "For growing teams that need more room.",
    features: [
      "Unlimited boards",
      "Everything in Free",
      "AI assistant",
      "Larger file uploads",
    ],
    cta: "Start with Pro",
    highlight: true,
  },
  {
    name: "Team",
    price: "$19",
    period: "per user / month",
    description: "For organizations that want more control.",
    features: [
      "Everything in Pro",
      "Priority support",
      "Advanced permissions",
      "Extended activity history",
    ],
    cta: "Contact us",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground">
          Simple, transparent pricing
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Start for free and upgrade when your team grows.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col rounded-2xl border bg-surface p-6 ${
              plan.highlight ? "border-primary shadow-lg" : ""
            }`}
          >
            <h2 className="text-xl font-semibold text-foreground">
              {plan.name}
            </h2>
            <p className="mt-1 text-sm text-muted">{plan.description}</p>

            <p className="mt-5">
              <span className="text-4xl font-bold text-foreground">
                {plan.price}
              </span>{" "}
              <span className="text-sm text-muted">{plan.period}</span>
            </p>

            <ul className="mt-5 flex-1 space-y-2 text-sm text-foreground">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="text-success">&#10003;</span>
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className={`mt-6 rounded-lg px-4 py-2 text-center text-sm font-medium ${
                plan.highlight
                  ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                  : "border border-border text-foreground hover:bg-surface-hover"
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

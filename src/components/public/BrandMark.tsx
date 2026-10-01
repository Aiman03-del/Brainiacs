import Link from "next/link";
import { BrainCircuit } from "lucide-react";

export default function BrandMark() {
  return (
    <Link
      href="/"
      aria-label="Brainiacs home"
      className="inline-flex items-center gap-2.5 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <BrainCircuit aria-hidden="true" className="h-5 w-5" />
      </span>
      <span className="text-lg font-bold text-foreground">Brainiacs</span>
    </Link>
  );
}
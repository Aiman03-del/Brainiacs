import type { ReactNode } from "react";
import { Bot, Check, ListChecks, MessageSquare, Sparkles } from "lucide-react";
import BrandMark from "@/components/public/BrandMark";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-background lg:grid lg:grid-cols-[1.08fr_0.92fr]">
      <section className="flex min-h-screen flex-col px-5 py-7 sm:px-10 lg:px-14">
        <BrandMark />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <div className="mb-8">
            <p className="mb-3 text-sm font-semibold text-primary">BRANIACS WORKSPACE</p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
            <p className="mt-3 text-base leading-7 text-muted">{subtitle}</p>
          </div>
          {children}
        </div>
        <p className="text-center text-xs text-muted lg:text-left">A calmer way to move team work forward.</p>
      </section>

      <aside className="relative hidden min-h-screen overflow-hidden bg-inverse px-10 py-12 text-inverse-foreground lg:flex lg:flex-col lg:justify-between xl:px-14">
        <div className="flex items-center gap-2 text-sm font-medium text-inverse-foreground/70">
          <Sparkles aria-hidden="true" className="h-4 w-4 text-primary" />
          One workspace, better momentum
        </div>
        <div className="mx-auto w-full max-w-lg py-12">
          <h2 className="max-w-md text-4xl font-semibold leading-tight">Bring good ideas all the way to done.</h2>
          <p className="mt-4 max-w-md leading-7 text-inverse-foreground/65">
            Keep conversations, decisions, and next steps connected to the work your team is doing.
          </p>
          <div className="mt-10 border-y border-inverse-foreground/15 py-5">
            <div className="flex items-center gap-3 border-b border-inverse-foreground/10 pb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/20 text-primary">
                <ListChecks aria-hidden="true" className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Launch the next big thing</p>
                <p className="mt-1 text-xs text-inverse-foreground/50">Product team · In progress</p>
              </div>
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-primary/70 text-primary">
                <Check aria-hidden="true" className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-4 text-xs text-inverse-foreground/70">
              <span className="flex items-center gap-2"><MessageSquare aria-hidden="true" className="h-4 w-4 text-primary" />Team chat</span>
              <span className="flex items-center gap-2"><ListChecks aria-hidden="true" className="h-4 w-4 text-primary" />Shared tasks</span>
              <span className="flex items-center gap-2"><Bot aria-hidden="true" className="h-4 w-4 text-primary" />AI support</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-inverse-foreground/45">Brainiacs · Work better together</p>
      </aside>
    </main>
  );
}
"use client";

import { useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { Bell, Inbox, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AvatarGroup } from "@/components/ui/AvatarGroup";
import { useConfirm } from "@/components/ui/confirm";
import { fadeUp, hoverLift, stagger, viewportOnce } from "@/lib/motion";

const swatches = [
  { name: "background", className: "bg-background" },
  { name: "surface", className: "bg-surface" },
  { name: "surface-muted", className: "bg-surface-muted" },
  { name: "primary", className: "bg-primary" },
  { name: "primary-soft", className: "bg-primary-soft" },
  { name: "accent", className: "bg-accent" },
  { name: "success", className: "bg-success" },
  { name: "warning", className: "bg-warning" },
  { name: "danger", className: "bg-danger" },
];

const users = [
  { id: "1", name: "Ada Lovelace" },
  { id: "2", name: "Alan Turing" },
  { id: "3", name: "Grace Hopper" },
  { id: "4", name: "Linus Torvalds" },
  { id: "5", name: "Margaret Hamilton" },
  { id: "6", name: "Dennis Ritchie" },
];

const cardsContainer = stagger(0.08);

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <motion.section
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      className="space-y-4"
    >
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </motion.section>
  );
}

export default function DesignShowcase() {
  const confirm = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLoading = () => {
    setLoading(true);
    window.setTimeout(() => setLoading(false), 1500);
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: "Delete this board?",
      description: "This action cannot be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (ok) toast.success("Board deleted");
    else toast("Cancelled");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl space-y-12 px-5 py-8 sm:px-6 sm:py-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Design system</h1>
            <p className="mt-1 text-sm text-muted">
              Shared interface components and theme tokens.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <Section title="Color tokens">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {swatches.map((swatch) => (
              <div key={swatch.name} className="space-y-1.5">
                <div className={`h-14 rounded-control border ${swatch.className}`} />
                <p className="text-xs text-muted">{swatch.name}</p>
              </div>
            ))}
          </div>
          <div className="h-14 rounded-control bg-brand-gradient" />
          <p className="text-2xl font-bold">
            <span className="text-gradient">Gradient text</span>
          </p>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button leftIcon={<Plus className="h-4 w-4" />}>With icon</Button>
            <Button loading={loading} onClick={handleLoading}>
              {loading ? "Saving" : "Click to load"}
            </Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex items-center gap-2">
            <IconButton label="Notifications" icon={<Bell className="h-4 w-4" />} />
            <IconButton
              label="Delete"
              variant="danger"
              icon={<Trash2 className="h-4 w-4" />}
            />
          </div>
        </Section>

        <Section title="Badges and avatars">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Neutral</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
          </div>
          <AvatarGroup users={users} max={4} size={36} />
        </Section>

        <Section title="Overlays and feedback">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setModalOpen(true)}>
              Open modal
            </Button>
            <Button variant="outline" onClick={handleDelete}>
              Confirm dialog
            </Button>
            <Button variant="outline" onClick={() => toast.success("Saved successfully")}>
              Success toast
            </Button>
            <Button variant="outline" onClick={() => toast.error("Something went wrong")}>
              Error toast
            </Button>
          </div>
        </Section>

        <Section title="Loading skeleton">
          <div className="space-y-3 rounded-card border border-border bg-surface p-5 shadow-elev-1">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </Section>

        <Section title="Empty state">
          <div className="rounded-card border border-border bg-surface">
            <EmptyState
              icon={Inbox}
              title="No boards yet"
              description="Create your first board to start planning work with your team."
              action={<Button leftIcon={<Plus className="h-4 w-4" />}>New board</Button>}
            />
          </div>
        </Section>

        <Section title="Scroll reveal and hover motion">
          <motion.div
            variants={cardsContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            className="grid gap-4 sm:grid-cols-3"
          >
            {[1, 2, 3].map((number) => (
              <motion.div
                key={number}
                variants={fadeUp}
                {...hoverLift}
                className="rounded-card border border-border bg-surface p-5 shadow-elev-1 hover:shadow-elev-2"
              >
                <p className="font-semibold text-foreground">Card {number}</p>
                <p className="mt-1 text-sm text-muted">
                  Hover me. I lift slightly and press down on click.
                </p>
              </motion.div>
            ))}
          </motion.div>
        </Section>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Example modal"
        description="Press Escape, click outside or use the buttons to close."
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setModalOpen(false);
                toast.success("Done");
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <p className="text-sm text-foreground">
          Focus stays in this dialog while it is open and returns to the trigger
          when it closes.
        </p>
      </Modal>
    </div>
  );
}
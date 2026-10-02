"use client";

import { useEffect, useState } from "react";
import { LockKeyhole, UserRound } from "lucide-react";

const sections = [
  { id: "account", label: "Account", icon: UserRound },
  { id: "security", label: "Security", icon: LockKeyhole },
] as const;

export default function SettingsNavigation() {
  const [activeSection, setActiveSection] = useState("account");

  useEffect(() => {
    const updateActiveSection = () => {
      const section = window.location.hash.slice(1);
      setActiveSection(sections.some((item) => item.id === section) ? section : "account");
    };

    updateActiveSection();
    window.addEventListener("hashchange", updateActiveSection);
    return () => window.removeEventListener("hashchange", updateActiveSection);
  }, []);

  return (
    <nav
      aria-label="Settings sections"
      className="flex gap-2 overflow-x-auto border-b border-border pb-2 md:flex-col md:overflow-visible md:border-0 md:pb-0"
    >
      {sections.map(({ id, label, icon: Icon }) => (
        <a
          key={id}
          href={`#${id}`}
          onClick={() => setActiveSection(id)}
          aria-current={activeSection === id ? "location" : undefined}
          className={`flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${activeSection === id ? "bg-surface-muted text-foreground" : "text-muted hover:bg-surface-hover hover:text-foreground"}`}
        >
          <Icon aria-hidden="true" className="h-4 w-4" />
          {label}
        </a>
      ))}
    </nav>
  );
}
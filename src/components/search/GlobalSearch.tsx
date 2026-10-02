"use client";

import { useEffect, useId, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Hash,
  ListChecks,
  LoaderCircle,
  MessageSquareText,
  Search,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { APP_NAVIGATION } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";

interface SearchResult {
  id: string;
  href: string;
  title: string;
  detail: string;
  metadata?: string;
}

interface SearchGroup {
  label: string;
  icon: LucideIcon;
  results: SearchResult[];
}

interface SearchData {
  groups: SearchGroup[];
  count: number;
}

interface SearchItem extends SearchResult {
  group: string;
  icon: LucideIcon;
}

const EMPTY_SEARCH: SearchData = { groups: [], count: 0 };
const MIN_QUERY_LENGTH = 2;
const RESULT_LIMIT = 8;

function cleanSearchQuery(query: string): string {
  return query.replace(/[%_,()\\]/g, "").trim();
}

function useGlobalSearch(query: string) {
  const [supabase] = useState(() => createClient());
  const [response, setResponse] = useState({
    query: "",
    data: EMPTY_SEARCH,
    error: "",
  });
  const normalizedQuery = cleanSearchQuery(query);
  const ready = normalizedQuery.length >= MIN_QUERY_LENGTH;
  const currentResponse = response.query === normalizedQuery;
  const data = currentResponse ? response.data : EMPTY_SEARCH;
  const error = currentResponse ? response.error : "";
  const loading = ready && !currentResponse;

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const pattern = `%${normalizedQuery}%`;
      try {
        const [boardsResult, tasksResult, messagesResult] = await Promise.all([
          supabase
            .from("boards")
            .select("id, name, description")
            .ilike("name", pattern)
            .order("name", { ascending: true })
            .limit(RESULT_LIMIT),
          supabase
            .from("tasks")
            .select("id, board_id, title, description, columns(title), boards(name)")
            .or(`title.ilike.${pattern},description.ilike.${pattern}`)
            .order("created_at", { ascending: false })
            .limit(RESULT_LIMIT),
          supabase
            .from("messages")
            .select("id, board_id, text, created_at, boards(name)")
            .is("deleted_at", null)
            .not("text", "is", null)
            .ilike("text", pattern)
            .order("created_at", { ascending: false })
            .limit(RESULT_LIMIT),
        ]);

        if (cancelled) return;

        const queryError =
          boardsResult.error ?? tasksResult.error ?? messagesResult.error;
        if (queryError) {
          setResponse({
            query: normalizedQuery,
            data: EMPTY_SEARCH,
            error: "Unable to search right now. Please try again.",
          });
          return;
        }

        const groups: SearchGroup[] = [
          {
            label: "Channels",
            icon: Hash,
            results: (boardsResult.data ?? []).map((board) => ({
              id: board.id,
              href: `/dashboard/messenger/${board.id}`,
              title: board.name,
              detail: board.description ?? "Open channel conversation",
            })),
          },
          {
            label: "Tasks",
            icon: ListChecks,
            results: (tasksResult.data ?? []).map((task) => ({
              id: task.id,
              href: `/dashboard/boards/${task.board_id}`,
              title: task.title,
              detail: task.description ?? task.boards?.name ?? "Open task board",
              metadata: task.columns?.title ?? undefined,
            })),
          },
          {
            label: "Messages",
            icon: MessageSquareText,
            results: (messagesResult.data ?? []).map((message) => ({
              id: message.id,
              href: `/dashboard/messenger/${message.board_id}`,
              title: message.text ?? "",
              detail: message.boards?.name
                ? `In ${message.boards.name}`
                : "Open conversation",
              metadata: new Date(message.created_at).toLocaleDateString(),
            })),
          },
        ];
        const visibleGroups = groups.filter((group) => group.results.length > 0);
        setResponse({
          query: normalizedQuery,
          data: {
            groups: visibleGroups,
            count: visibleGroups.reduce(
              (total, group) => total + group.results.length,
              0,
            ),
          },
          error: "",
        });
      } catch {
        if (!cancelled) {
          setResponse({
            query: normalizedQuery,
            data: EMPTY_SEARCH,
            error: "Unable to search right now. Please try again.",
          });
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [normalizedQuery, ready, supabase]);

  return {
    data,
    loading,
    error,
    normalizedQuery,
    ready,
  };
}

function SearchResultGroups({
  groups,
  onNavigate,
}: {
  groups: SearchGroup[];
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-5">
      {groups.map((group) => {
        const Icon = group.icon;
        return (
          <section key={group.label} aria-label={group.label}>
            <h3 className="mb-1.5 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted">
              <Icon aria-hidden="true" className="h-3.5 w-3.5" />
              {group.label}
              <span className="ml-auto tabular-nums">{group.results.length}</span>
            </h3>
            <ul className="divide-y divide-border">
              {group.results.map((result) => (
                <li key={result.id}>
                  <Link
                    href={result.href}
                    onClick={onNavigate}
                    className="flex min-h-12 min-w-0 items-center gap-3 rounded-md px-2 py-2.5 hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {result.title}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted">
                        {result.detail}
                      </span>
                    </span>
                    {result.metadata && (
                      <span className="hidden max-w-32 shrink-0 truncate text-xs text-muted sm:block">
                        {result.metadata}
                      </span>
                    )}
                    <ArrowRight
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-muted"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function GlobalSearchResults({ query }: { query: string }) {
  const { data, loading, error, ready } = useGlobalSearch(query);

  if (!ready) {
    return (
      <p className="px-2 py-6 text-center text-sm text-muted">
        Enter at least 2 characters to search channels, messages, and tasks.
      </p>
    );
  }

  if (loading) {
    return (
      <p role="status" className="flex items-center justify-center gap-2 py-8 text-sm text-muted">
        <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
        Searching…
      </p>
    );
  }

  if (error) {
    return <p role="alert" className="py-8 text-center text-sm text-danger">{error}</p>;
  }

  if (!data.count) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm font-medium text-foreground">No results found</p>
        <p className="mt-1 text-sm text-muted">Try a different search query.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-xs text-muted" role="status">
        {data.count} {data.count === 1 ? "result" : "results"}
      </p>
      <SearchResultGroups groups={data.groups} />
    </div>
  );
}

export function GlobalSearchPage({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground">Search</h1>
      <form action="/dashboard/search">
        <label className="mt-5 flex min-h-12 items-center gap-3 rounded-lg border border-border bg-surface px-3 focus-within:border-primary">
          <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
          <span className="sr-only">Search Brainiacs</span>
          <input
            type="search"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Brainiacs..."
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="rounded-md p-1 text-muted hover:bg-surface-hover hover:text-foreground"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </label>
      </form>
      <div className="mt-6" aria-live="polite">
        <GlobalSearchResults query={query} />
      </div>
    </div>
  );
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  const listId = useId();
  const { data, loading, error, normalizedQuery, ready } = useGlobalSearch(query);
  const navigation = APP_NAVIGATION.flatMap((group) => group.items).filter(
    (item) => item.href !== "/dashboard/search",
  );
  const matchingNavigation = navigation.filter((item) =>
    `${item.label} ${item.href}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  const items: SearchItem[] = [
    ...matchingNavigation.map((item) => ({
      id: item.href,
      href: item.href,
      title: item.label,
      detail: "Open page",
      group: "Navigation",
      icon: item.icon,
    })),
    ...(ready
      ? data.groups.flatMap((group) =>
          group.results.map((result) => ({
            ...result,
            group: group.label,
            icon: group.icon,
          })),
        )
      : []),
  ];
  const activeItemId = items[activeIndex]
    ? `${items[activeIndex].group}-${items[activeIndex].id}`
    : "";

  useEffect(() => {
    if (activeItemId) {
      document
        .getElementById(`${listId}-${activeIndex}`)
        ?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex, activeItemId, listId]);

  useEffect(() => {
    const handleShortcut = (event: globalThis.KeyboardEvent) => {
      const target = event.target;
      const isEditing =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.matches("input, textarea, select, [contenteditable='true']"));
      if (
        isEditing ||
        !(event.ctrlKey || event.metaKey) ||
        event.key.toLowerCase() !== "k"
      ) {
        return;
      }
      event.preventDefault();
      setOpen(true);
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (items.length ? (index + 1) % items.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (items.length ? (index - 1 + items.length) % items.length : 0));
    } else if (event.key === "Enter" && items[activeIndex]) {
      event.preventDefault();
      router.push(items[activeIndex].href);
      close();
    }
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (normalizedQuery) params.set("q", normalizedQuery);
    router.push(`/dashboard/search${params.size ? `?${params}` : ""}`);
    close();
  };

  const itemGroups = items.reduce<{ label: string; items: SearchItem[] }[]>(
    (groups, item) => {
      const group = groups.find((candidate) => candidate.label === item.group);
      if (group) group.items.push(item);
      else groups.push({ label: item.group, items: [item] });
      return groups;
    },
    [],
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search Brainiacs"
        title="Search Brainiacs"
        className="hidden h-10 w-64 items-center gap-2 rounded-lg border border-border bg-background px-3 text-left text-sm text-muted hover:border-muted sm:flex lg:w-80"
      >
        <Search aria-hidden="true" className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate">Search Brainiacs...</span>
        <kbd className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted">
          Ctrl/Cmd K
        </kbd>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search Brainiacs"
        title="Search Brainiacs"
        className="rounded-md p-2 text-muted hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary sm:hidden"
      >
        <Search aria-hidden="true" className="h-5 w-5" />
      </button>

      <Modal
        open={open}
        onClose={close}
        title="Search Brainiacs"
        description="Search channels, messages, and tasks, or jump to a page."
        size="lg"
        className="max-h-[85dvh] sm:mb-0"
      >
        <form onSubmit={handleFormSubmit}>
          <label className="flex min-h-12 items-center gap-3 rounded-lg border border-border bg-background px-3 focus-within:border-primary">
            <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-muted" />
            <span className="sr-only">Search Brainiacs</span>
            <input
              data-autofocus
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={items.length > 0}
              aria-controls={listId}
              aria-activedescendant={items[activeIndex] ? `${listId}-${activeIndex}` : undefined}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleInputKeyDown}
              placeholder="Search Brainiacs..."
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
            />
            <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted sm:inline">
              ESC
            </kbd>
          </label>
          <div className="mt-4 max-h-[55dvh] overflow-y-auto" aria-live="polite">
            {loading && (
              <p role="status" className="flex items-center gap-2 px-2 py-3 text-sm text-muted">
                <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
                Searching workspace...
              </p>
            )}
            {error && <p role="alert" className="px-2 py-3 text-sm text-danger">{error}</p>}
            {ready && !loading && !error && data.count === 0 && (
              <p className="px-2 py-4 text-sm text-muted">No results found. Try a different query.</p>
            )}
            {!ready && query.trim().length > 0 && (
              <p className="px-2 py-3 text-xs text-muted">Type at least 2 characters to search workspace content.</p>
            )}
            {itemGroups.length ? (
              <div id={listId} role="listbox" aria-label="Search suggestions" className="space-y-4">
                {itemGroups.map((group) => (
                  <section key={group.label} aria-label={group.label}>
                    <h3 className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-muted">
                      {group.label}
                    </h3>
                    <ul>
                      {group.items.map((item) => {
                        const index = items.indexOf(item);
                        const Icon = item.icon;
                        return (
                          <li key={`${item.group}-${item.id}`}>
                            <Link
                              id={`${listId}-${index}`}
                              role="option"
                              aria-selected={index === activeIndex}
                              tabIndex={-1}
                              href={item.href}
                              onClick={close}
                              className={`flex min-h-11 items-center gap-3 rounded-md px-2 text-sm focus-visible:outline-2 focus-visible:outline-primary ${index === activeIndex ? "bg-surface-hover text-foreground" : "text-muted hover:bg-surface-hover hover:text-foreground"}`}
                            >
                              <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                              <span className="min-w-0 flex-1 truncate">{item.title}</span>
                              <span className="hidden max-w-40 truncate text-xs text-muted sm:block">
                                {item.detail}
                              </span>
                              <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
              </div>
            ) : !loading && !error && !ready ? (
              <p className="px-2 py-4 text-sm text-muted">No matching pages.</p>
            ) : null}
            {!ready && query.length === 0 && !itemGroups.length && (
              <p className="px-2 py-4 text-sm text-muted">Navigate anywhere in Brainiacs.</p>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted">
            <span>↑ ↓ to navigate · Enter to open</span>
            <button
              type="submit"
              className="inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 hover:bg-surface-hover hover:text-foreground"
            >
              Search page <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
import type {
  Message,
  MessageAttachment,
  MessageReactions,
  MessageRow,
  Poll,
  PollOptions,
  PollRow,
} from "@/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseAttachments(value: unknown): MessageAttachment[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((attachment): MessageAttachment[] => {
    if (
      !isRecord(attachment) ||
      typeof attachment.path !== "string" ||
      typeof attachment.name !== "string" ||
      typeof attachment.type !== "string" ||
      typeof attachment.size !== "number"
    ) {
      return [];
    }

    return [
      {
        path: attachment.path,
        name: attachment.name,
        type: attachment.type,
        size: attachment.size,
      },
    ];
  });
}

export function parseReactions(value: unknown): MessageReactions {
  if (!isRecord(value)) return {};

  const entries: Array<[string, string[]]> = [];
  for (const [emoji, users] of Object.entries(value)) {
    if (
      Array.isArray(users) &&
      users.every((user): user is string => typeof user === "string")
    ) {
      entries.push([emoji, users]);
    }
  }

  return Object.fromEntries(entries);
}

function parsePollOptions(value: unknown): PollOptions {
  return Array.isArray(value)
    ? value.filter((option): option is string => typeof option === "string")
    : [];
}

export function toMessage(row: MessageRow): Message {
  return {
    ...row,
    attachments: parseAttachments(row.attachments),
    reactions: parseReactions(row.reactions),
  };
}

export function toPoll(
  row: PollRow,
  pollVotes: Poll["poll_votes"] = [],
): Poll {
  return {
    ...row,
    options: parsePollOptions(row.options),
    poll_votes: pollVotes,
  };
}
import type { Database } from "./database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Board = Database["public"]["Tables"]["boards"]["Row"];
export type Column = Database["public"]["Tables"]["columns"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type BoardMember =
  Database["public"]["Tables"]["board_members"]["Row"];
export type Activity = Database["public"]["Tables"]["activities"]["Row"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];
export type PollRow = Database["public"]["Tables"]["polls"]["Row"];
export type PollVote = Database["public"]["Tables"]["poll_votes"]["Row"];

export type BoardSummary = Pick<
  Board,
  "id" | "name" | "theme" | "visibility" | "description"
>;
export type ActivityBoardSummary = Pick<Board, "id" | "name">;

export type BoardWithMembers = Pick<
  Board,
  | "id"
  | "name"
  | "description"
  | "visibility"
  | "theme"
  | "created_by"
  | "created_at"
> & {
  board_members: Pick<BoardMember, "user_id">[] | null;
};

export type BoardMemberWithProfile = Pick<BoardMember, "user_id" | "role"> & {
  profiles: Pick<Profile, "display_name" | "photo_url" | "email"> | null;
};

export type ProfileSearchResult = Pick<
  Profile,
  "id" | "display_name" | "email" | "photo_url"
>;

export type ActivityFeedRow = Pick<
  Activity,
  "id" | "entity" | "action" | "message" | "created_at" | "board_id"
> & {
  boards: Pick<Board, "name"> | null;
  profiles: Pick<Profile, "display_name"> | null;
};

export type BoardInvite = Pick<
  Database["public"]["Tables"]["join_requests"]["Row"],
  "id" | "board_id" | "created_at"
> & {
  boards: Pick<Board, "name"> | null;
  sender: Pick<Profile, "display_name"> | null;
};

export interface MessageAttachment {
  path: string;
  name: string;
  type: string;
  size: number;
}

export type MessageReactions = Record<string, string[]>;

export type Message = Omit<MessageRow, "attachments" | "reactions"> & {
  attachments: MessageAttachment[];
  reactions: MessageReactions;
};

export type PollOptions = string[];

export type Poll = Omit<PollRow, "options"> & {
  options: PollOptions;
  poll_votes: Pick<PollVote, "user_id" | "option_index">[];
};

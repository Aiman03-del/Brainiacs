export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Relationship<
  ForeignKeyName extends string,
  Column extends string,
  ReferencedRelation extends string,
  ReferencedColumn extends string = "id",
> = {
  foreignKeyName: ForeignKeyName;
  columns: [Column];
  isOneToOne: boolean;
  referencedRelation: ReferencedRelation;
  referencedColumns: [ReferencedColumn];
};

type Table<Row, Insert, Update, Relationships = []> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: Relationships;
};

type ProfileRow = {
  id: string;
  display_name: string | null;
  email: string | null;
  photo_url: string | null;
  created_at: string;
};

type BoardRow = {
  id: string;
  name: string;
  description: string | null;
  visibility: "Public" | "Private";
  theme: string;
  created_by: string;
  created_at: string;
};

type ColumnRow = {
  id: string;
  board_id: string;
  title: string;
  position: number;
  created_at: string;
};

type TaskRow = {
  id: string;
  board_id: string;
  column_id: string;
  title: string;
  description: string | null;
  start_at: string | null;
  due_at: string | null;
  reminder: string | null;
  position: number;
  created_at: string;
};

type BoardMemberRow = {
  board_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
};

type ActivityRow = {
  id: string;
  board_id: string;
  user_id: string;
  entity: string;
  action: string;
  message: string;
  created_at: string;
};

type CompletedTaskRow = {
  task_id: string;
  user_id: string;
  completed_at: string;
};

type JoinRequestRow = {
  id: string;
  board_id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
};

type UserSettingsRow = {
  user_id: string;
  notify_invites: boolean;
  notify_task_reminders: boolean;
  allow_invites: "everyone" | "nobody";
  updated_at: string;
};

type MessageRow = {
  id: string;
  board_id: string;
  sender_id: string;
  text: string | null;
  attachments: Json;
  reactions: Json;
  is_pinned: boolean;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
};

type PollRow = {
  id: string;
  board_id: string;
  created_by: string;
  question: string;
  options: Json;
  created_at: string;
};

type PollVoteRow = {
  poll_id: string;
  user_id: string;
  option_index: number;
  created_at: string;
};

type LeaderboardRow = {
  user_id: string;
  display_name: string | null;
  photo_url: string | null;
  points: number;
};

export type Database = {
  public: {
    Tables: {
      activities: Table<
        ActivityRow,
        Pick<ActivityRow, "board_id" | "user_id" | "entity" | "action" | "message">,
        Partial<ActivityRow>,
        [
          Relationship<"activities_board_id_fkey", "board_id", "boards">,
          Relationship<"activities_user_id_fkey", "user_id", "profiles">,
        ]
      >;
      board_members: Table<
        BoardMemberRow,
        Pick<BoardMemberRow, "board_id" | "user_id" | "role">,
        Partial<BoardMemberRow>,
        [
          Relationship<"board_members_board_id_fkey", "board_id", "boards">,
          Relationship<"board_members_user_id_fkey", "user_id", "profiles">,
        ]
      >;
      boards: Table<
        BoardRow,
        Pick<BoardRow, "name" | "created_by"> & Partial<BoardRow>,
        Partial<BoardRow>,
        [Relationship<"boards_created_by_fkey", "created_by", "profiles">]
      >;
      columns: Table<
        ColumnRow,
        Pick<ColumnRow, "board_id" | "title" | "position">,
        Partial<ColumnRow>,
        [Relationship<"columns_board_id_fkey", "board_id", "boards">]
      >;
      completed_tasks: Table<
        CompletedTaskRow,
        Pick<CompletedTaskRow, "task_id" | "user_id">,
        Partial<CompletedTaskRow>,
        [
          Relationship<"completed_tasks_task_id_fkey", "task_id", "tasks">,
          Relationship<"completed_tasks_user_id_fkey", "user_id", "profiles">,
        ]
      >;
      join_requests: Table<
        JoinRequestRow,
        Pick<JoinRequestRow, "board_id" | "sender_id" | "receiver_id"> &
          Partial<JoinRequestRow>,
        Partial<JoinRequestRow>,
        [
          Relationship<"join_requests_board_id_fkey", "board_id", "boards">,
          Relationship<"sender_id", "sender_id", "profiles">,
          Relationship<"receiver_id", "receiver_id", "profiles">,
        ]
      >;
      messages: Table<
        MessageRow,
        Pick<MessageRow, "board_id" | "sender_id"> &
          Partial<MessageRow>,
        Partial<MessageRow>,
        [
          Relationship<"messages_board_id_fkey", "board_id", "boards">,
          Relationship<"messages_sender_id_fkey", "sender_id", "profiles">,
        ]
      >;
      poll_votes: Table<
        PollVoteRow,
        Pick<PollVoteRow, "poll_id" | "user_id" | "option_index">,
        Partial<PollVoteRow>,
        [
          Relationship<"poll_votes_poll_id_fkey", "poll_id", "polls">,
          Relationship<"poll_votes_user_id_fkey", "user_id", "profiles">,
        ]
      >;
      polls: Table<
        PollRow,
        Pick<PollRow, "board_id" | "created_by" | "question" | "options">,
        Partial<PollRow>,
        [
          Relationship<"polls_board_id_fkey", "board_id", "boards">,
          Relationship<"polls_created_by_fkey", "created_by", "profiles">,
        ]
      >;
      profiles: Table<
        ProfileRow,
        Pick<ProfileRow, "id"> & Partial<ProfileRow>,
        Partial<ProfileRow>
      >;
      tasks: Table<
        TaskRow,
        Pick<TaskRow, "board_id" | "column_id" | "title"> &
          Partial<TaskRow>,
        Partial<TaskRow>,
        [
          Relationship<"tasks_board_id_fkey", "board_id", "boards">,
          Relationship<"tasks_column_id_fkey", "column_id", "columns">,
        ]
      >;
      user_settings: Table<
        UserSettingsRow,
        Pick<UserSettingsRow, "user_id"> & Partial<UserSettingsRow>,
        Partial<UserSettingsRow>,
        [Relationship<"user_settings_user_id_fkey", "user_id", "profiles">]
      >;
    };
    Views: {
      leaderboard: {
        Row: LeaderboardRow;
        Relationships: [
          Relationship<"leaderboard_user_id_fkey", "user_id", "profiles">
        ];
      };
    };
    Functions: {
      delete_user_data: {
        Args: { p_user_id: string };
        Returns: string[];
      };
      reorder_columns: {
        Args: { items: Json };
        Returns: undefined;
      };
      reorder_tasks: {
        Args: { items: Json };
        Returns: undefined;
      };
      respond_to_join_request: {
        Args: { request_id: string; new_status: "accepted" | "rejected" };
        Returns: undefined;
      };
      set_message_pinned: {
        Args: { p_message_id: string; p_pinned: boolean };
        Returns: undefined;
      };
      toggle_reaction: {
        Args: { p_message_id: string; p_emoji: string };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
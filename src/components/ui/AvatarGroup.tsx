import Avatar from "@/components/Avatar";

interface AvatarGroupUser {
  id: string;
  name: string;
  photoUrl?: string | null;
}

interface AvatarGroupProps {
  users: AvatarGroupUser[];
  max?: number;
  size?: number;
}

export function AvatarGroup({ users, max = 4, size = 36 }: AvatarGroupProps) {
  const visibleUsers = users.slice(0, max);
  const remaining = users.length - visibleUsers.length;

  return (
    <div aria-label={`${users.length} people`} className="flex items-center pl-2">
      {visibleUsers.map((user, index) => (
        <span
          key={user.id}
          className="-ml-2 rounded-full ring-2 ring-surface"
          style={{ zIndex: visibleUsers.length - index }}
        >
          <Avatar name={user.name} src={user.photoUrl} size={size} />
        </span>
      ))}
      {remaining > 0 && (
        <span
          className="-ml-2 flex shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-muted ring-2 ring-surface"
          style={{ width: size, height: size }}
          aria-label={`${remaining} more people`}
        >
          +{remaining}
        </span>
      )}
    </div>
  );
}
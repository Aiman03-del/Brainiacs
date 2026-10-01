export default function Avatar({ name, src, size = 36 }) {
  const initial = (name ?? "?").charAt(0).toUpperCase();
  const style = { width: size, height: size, fontSize: size * 0.4 };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? "Avatar"}
        style={style}
        className="shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <span
      style={style}
      className="flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground"
    >
      {initial}
    </span>
  );
}

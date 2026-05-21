import clsx from "clsx";


export function Panel({
  title,
  subtitle,
  className,
  children,
}: {
  title?: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={clsx("rounded-3xl border border-line bg-white p-5 shadow-panel", className)}>
      {title ? (
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}


/** Primer elemento enfocable de la página: lleva al contenido principal (#contenido). */
export function SkipLink({ label }: { label: string }) {
  return (
    <a
      href="#contenido"
      className="absolute -top-20 left-3 z-[200] rounded-(--radius-s) bg-text px-4.5 py-3 font-semibold text-background no-underline focus:top-3"
    >
      {label}
    </a>
  );
}

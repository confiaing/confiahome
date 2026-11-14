import { Emphasized } from "@/components/ui/emphasized";
import { DISPLAY, EYEBROW } from "@/components/ui/typography";
import { cx } from "@/lib/cx";

type SectionHeadingProps = {
  /** Identificador del título: la sección lo usa como nombre accesible. */
  id: string;
  title: string;
  eyebrow?: string;
  className?: string;
};

/** Antetítulo y título de una sección de la home. */
export function SectionHeading({ id, title, eyebrow, className }: SectionHeadingProps) {
  return (
    <div className={className}>
      {eyebrow ? <p className={EYEBROW}>{eyebrow}</p> : null}
      <h2 id={id} className={cx(DISPLAY, "text-[clamp(2.1rem,4.6vw,3.9rem)]", eyebrow && "mt-4")}>
        <Emphasized text={title} />
      </h2>
    </div>
  );
}

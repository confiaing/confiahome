import { splitEmphasis } from "@/lib/emphasis";
import { cx } from "@/lib/cx";

type EmphasizedProps = {
  /** Texto del diccionario; lo que va entre *asteriscos* se resalta. */
  text: string;
  /** `accent`: cursiva en el color de énfasis. `plain`: solo cursiva. */
  tone?: "accent" | "plain";
};

export function Emphasized({ text, tone = "accent" }: EmphasizedProps) {
  return (
    <>
      {splitEmphasis(text).map((run, index) =>
        run.emphasis ? (
          <em key={index} className={cx("font-normal italic", tone === "accent" && "text-emphasis")}>
            {run.text}
          </em>
        ) : (
          run.text
        ),
      )}
    </>
  );
}

import { useEffect, useRef, useState } from "react";

const CHAR_MS = 42;
const PAUSE_MS = 2600;
const CURSOR = "▌";

/**
 * Texto de ejemplo que se va «tecleando» dentro de un campo, un ejemplo tras otro.
 * Empieza cuando el campo entra en pantalla. Con movimiento reducido, sin
 * IntersectionObserver o en el servidor, devuelve el primer ejemplo completo y fijo.
 * Es solo una sugerencia visual: el campo tiene su etiqueta y no depende de esto.
 */
export function useTypedExamples<T extends HTMLElement>(examples: readonly string[], prefix: string) {
  const target = useRef<T>(null);
  const texts = examples.map((example) => `${prefix} ${example}`);
  const first = texts[0] ?? "";
  const [shown, setShown] = useState(first);
  const key = texts.join("\n");

  useEffect(() => {
    const node = target.current;
    const list = key.split("\n");
    const reduced = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!node || reduced || typeof IntersectionObserver === "undefined" || list.length === 0) return;

    let timer = 0;
    let stopped = false;
    const run = (index: number) => {
      const text = list[index % list.length]!;
      let length = 0;
      const step = () => {
        if (stopped) return;
        setShown(text.slice(0, length) + (length < text.length ? CURSOR : ""));
        if (length < text.length) {
          length += 1;
          timer = window.setTimeout(step, CHAR_MS);
        } else timer = window.setTimeout(() => run(index + 1), PAUSE_MS);
      };
      step();
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        run(0);
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => {
      stopped = true;
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [key]);

  return { target, placeholder: shown };
}

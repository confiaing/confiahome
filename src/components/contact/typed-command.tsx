import { useEffect, useRef, useState } from "react";

/**
 * El comando de la ventana de terminal, que se «teclea» al entrar en pantalla.
 * Es decorativo (quien lo usa lo marca aria-hidden). Con movimiento reducido, sin
 * IntersectionObserver o en el servidor, aparece completo.
 */
export function TypedCommand({ text }: { text: string }) {
  const [shown, setShown] = useState(text.length);
  const element = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = element.current;
    const reduced = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!node || reduced || typeof IntersectionObserver === "undefined") return;

    let timer = 0;
    setShown(0);
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        timer = window.setInterval(() => {
          setShown((count) => {
            if (count >= text.length) window.clearInterval(timer);
            return Math.min(text.length, count + 1);
          });
        }, 55);
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [text]);

  return (
    <span ref={element} data-typed-command>
      {text.slice(0, shown)}
    </span>
  );
}

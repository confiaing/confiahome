import { render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { WebAnalytics } from "@/components/analytics/web-analytics";

const SRC = "https://static.cloudflareinsights.com/beacon.min.js";
const scripts = () => [...document.head.querySelectorAll<HTMLScriptElement>(`script[src="${SRC}"]`)];
const setPrivacy = (flags: { gpc?: boolean; dnt?: string | null }) => {
  Object.defineProperty(navigator, "globalPrivacyControl", { configurable: true, value: flags.gpc });
  Object.defineProperty(navigator, "doNotTrack", { configurable: true, value: flags.dnt ?? null });
};

beforeEach(() => setPrivacy({}));
afterEach(() => {
  for (const script of scripts()) script.remove();
});

// analytics-instrumentation · Visitas con Cloudflare Web Analytics (L7-1)
// legal-pages · La política describe lo que el sitio hace: con «No rastrear» no se cuenta la visita
describe("WebAnalytics", () => {
  it("no pinta nada en el HTML servido: el script solo se pide desde el navegador", () => {
    expect(renderToStaticMarkup(<WebAnalytics token="abc123def456" />)).toBe("");
  });

  it.each([null, "", "   "])("sin token (%j) no pide nada", (token) => {
    render(<WebAnalytics token={token} />);
    expect(scripts()).toHaveLength(0);
  });

  it("con token pide el script de Cloudflare, diferido, con ese token y una sola vez", () => {
    const view = render(<WebAnalytics token="abc123def456" />);
    view.rerender(<WebAnalytics token="abc123def456" />);
    expect(scripts()).toHaveLength(1);
    expect(scripts()[0]!.defer).toBe(true);
    expect(JSON.parse(scripts()[0]!.getAttribute("data-cf-beacon")!)).toEqual({ token: "abc123def456" });
  });

  it.each([{ gpc: true }, { dnt: "1" }])("con %j no pide el script: esa visita no se cuenta", (flags) => {
    setPrivacy(flags);
    render(<WebAnalytics token="abc123def456" />);
    expect(scripts()).toHaveLength(0);
  });

  it("un token con caracteres extraños no pide nada", () => {
    render(<WebAnalytics token={'x"}\'><script>alert(1)</script>'} />);
    expect(scripts()).toHaveLength(0);
    expect(document.head.innerHTML).not.toContain("alert(1)");
  });
});

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WebAnalytics } from "@/components/analytics/web-analytics";

// analytics-instrumentation · Visitas con Cloudflare Web Analytics (L7-1)
describe("WebAnalytics", () => {
  it.each([null, "", "   "])("sin token (%j) no incluye nada", (token) => {
    expect(renderToStaticMarkup(<WebAnalytics token={token} />)).toBe("");
  });

  it("con token incluye el script de Cloudflare, diferido, con ese token", () => {
    const html = renderToStaticMarkup(<WebAnalytics token="abc123def456" />);
    const page = new DOMParser().parseFromString(html, "text/html");
    const script = page.querySelector("script")!;
    expect(script.getAttribute("src")).toBe("https://static.cloudflareinsights.com/beacon.min.js");
    expect(script.hasAttribute("defer")).toBe(true);
    expect(JSON.parse(script.getAttribute("data-cf-beacon")!)).toEqual({ token: "abc123def456" });
    expect(page.querySelectorAll("script")).toHaveLength(1);
  });

  it("un token con caracteres extraños no puede romper el atributo ni inyectar marcado", () => {
    const html = renderToStaticMarkup(<WebAnalytics token={'x"}\'><script>alert(1)</script>'} />);
    expect(html).toBe("");
  });
});

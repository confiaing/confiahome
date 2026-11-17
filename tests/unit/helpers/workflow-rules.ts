// Lo que ningún workflow de GitHub puede contener: la CI no usa secretos ni despliega (ADR-0017).
export const FORBIDDEN_IN_WORKFLOWS = ["secrets.", "GITHUB_TOKEN", "wrangler deploy", "opennextjs-cloudflare deploy", "supabase db push", "git push"];

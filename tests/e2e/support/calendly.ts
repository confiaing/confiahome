import type { Page } from "@playwright/test";

// Un Calendly de mentira servido en sus direcciones reales: el origen de sus mensajes es
// el verdadero (https://calendly.com) y ninguna prueba sale a la red.
const WIDGET = `window.Calendly = { initInlineWidget: function (o) {
  var f = document.createElement("iframe");
  f.src = o.url + "?embed_domain=" + location.hostname + "&embed_type=Inline";
  f.title = "Select a Date & Time - Calendly";
  f.width = "100%"; f.height = "100%"; f.frameBorder = "0";
  o.parentElement.appendChild(f);
} };`;
const bookingPage = (delay: number) => `<!doctype html><html lang="en"><title>Calendly</title><body>
<h1>30 Minute Meeting</h1><button id="book">Schedule Event</button>
<script>
  var say = function (event) { parent.postMessage({ event: event, payload: {} }, "*"); };
  setTimeout(function () { say("calendly.page_height"); say("calendly.event_type_viewed"); }, ${delay});
  document.getElementById("book").addEventListener("click", function () { say("calendly.event_scheduled"); });
</script></body></html>`;

/** `delay`: cuánto tarda el calendario en dar su primera señal, como el real (varios segundos). */
export async function fakeCalendly(page: Page, delay = 0) {
  await page.route("https://assets.calendly.com/**", (route) => route.fulfill({ contentType: "text/javascript", body: WIDGET }));
  await page.route("https://calendly.com/**", (route) => route.fulfill({ contentType: "text/html", body: bookingPage(delay) }));
}

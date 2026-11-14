import { Closing } from "@/components/sections/closing";
import { SceneController } from "@/components/journey/scene/scene-controller";
import { Hero } from "@/components/sections/hero";
import { JourneyOverview } from "@/components/sections/journey-overview";
import { Offer } from "@/components/sections/offer";
import { Trust } from "@/components/sections/trust";
import { WhereWeStart } from "@/components/sections/where-we-start";
import type { Dictionary } from "@/i18n/dictionaries";

/**
 * La home. El orden alterna fondo crema y banda de color:
 * hero (crema) · dónde empezamos (salvia) · etapas (crema) · servicios (coral) ·
 * confianza (crema) · cierre (índigo claro).
 */
export function HomeContent({ dictionary }: { dictionary: Dictionary }) {
  const { home, agenda } = dictionary;
  return (
    <main id="contenido" tabIndex={-1} className="focus-visible:outline-none">
      <Hero home={home} agenda={agenda} />
      <WhereWeStart start={home.start} />
      <JourneyOverview journey={home.journey} />
      <Offer offer={home.offer} />
      <Trust trust={home.trust} />
      <Closing home={home} agenda={agenda} />
      <SceneController />
    </main>
  );
}

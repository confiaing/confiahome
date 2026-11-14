import { JourneyTabs } from "@/components/journey/journey-tabs";
import { SceneSlot } from "@/components/journey/scene/scene-slot";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { LEDE } from "@/components/ui/typography";
import type { Dictionary } from "@/i18n/dictionaries";
import { cx } from "@/lib/cx";

type JourneyOverviewProps = { journey: Dictionary["home"]["journey"] };

/** «Cómo lo hacemos realidad»: el recorrido de cinco etapas, con su escena. */
export function JourneyOverview({ journey }: JourneyOverviewProps) {
  return (
    <Section id="como" labelledBy="journey-title">
      <div className="mb-[clamp(32px,5vw,60px)] max-w-[820px]">
        <SectionHeading id="journey-title" eyebrow={journey.eyebrow} title={journey.title} />
        <p className={cx(LEDE, "mt-5")}>{journey.lede}</p>
      </div>
      <JourneyTabs journey={journey} scene={<SceneSlot kind="journey" className="absolute inset-0" />} />
    </Section>
  );
}

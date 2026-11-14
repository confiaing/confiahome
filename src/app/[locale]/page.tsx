import { HomePlaceholder } from "@/components/sections/home-placeholder";
import { isLocale } from "@/i18n/locales";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <HomePlaceholder locale={locale} />;
}

"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";

export const headerLinks = [
  {
    label: "home",
    href: "/",
  },
  {
    label: "features",
    href: "#features",
  },
  {
    label: "team",
    href: "#team",
  },
  {
    label: "faq",
    href: "#faq",
  },
];

const SectionLinks = () => {
  const tHeader = useTranslations("Header");
  // const locale = useLocale();

  return (
    <div className="hidden md:flex flex-row items-center gap-x-4 font-bold">
      {headerLinks.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          title={tHeader(link.label)}
          prefetch={false}
          className="mx-2 hover:underline"
        >
          {tHeader(link.label)}
        </Link>
      ))}
    </div>
  );
};
export default SectionLinks;

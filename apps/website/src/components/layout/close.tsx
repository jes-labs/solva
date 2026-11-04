import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/navigation";

interface CloseCard {
  label: string;
  title: string;
  body: string;
  action: { label: string; href: string };
}

interface CloseProps {
  institutions?: Partial<CloseCard>;
  readers?: Partial<CloseCard>;
}

const DEFAULT_INSTITUTIONS: CloseCard = {
  label: "For institutions",
  title: "Put an asset on the record.",
  body: "Tell us which asset you issue or hold for customers. We plan a pilot with you and publish your first record together.",
  action: { label: "Talk to us", href: routes.contact },
};

const DEFAULT_READERS: CloseCard = {
  label: "For readers",
  title: "Read a record.",
  body: "See what a holder, a wallet, a lending pool or an auditor sees, and how one record answers the question each of them asks.",
  action: { label: "The coverage record", href: routes.coverageRecord },
};

export function Close({ institutions, readers }: CloseProps) {
  const left = { ...DEFAULT_INSTITUTIONS, ...institutions };
  const right = { ...DEFAULT_READERS, ...readers };
  return (
    <section aria-label="Next steps" className="chapter relative border-t border-line">
      <div data-rows className="grid lg:grid-cols-2">
        {[left, right].map((card, index) => (
          <div
            key={card.title}
            className="flex flex-col justify-between gap-10 border-b border-line px-5 py-14 last:border-b-0 sm:px-8 lg:border-r lg:border-b-0 lg:px-12 lg:py-20 lg:last:border-r-0"
          >
            <div>
              <p className="tick-lead font-sans text-small font-medium text-sec">{card.label}</p>
              <h2 className="mt-5 max-w-[14ch] font-display text-h1">{card.title}</h2>
              <p className="mt-5 max-w-md text-body text-sec">{card.body}</p>
            </div>
            <Button
              asChild
              size="lg"
              variant={index === 0 ? "default" : "secondary"}
              className="self-start"
            >
              <Link href={card.action.href}>
                {card.action.label}
                <ArrowRightIcon aria-hidden="true" />
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}

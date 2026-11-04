import { CaretDownIcon } from "@phosphor-icons/react/ssr";
import { StateStamp } from "@/components/ui/state-stamp";
import { headerGroups, routes } from "@/config/navigation";
import { coveragePercent } from "@/lib/amount";
import { exampleRecords } from "@/lib/example-records";
import { PopoverLink } from "./popover-link";

function menuId(label: string) {
  return `menu-${label.toLowerCase().replace(/\s+/g, "-")}`;
}

const latest = exampleRecords[0];

export function DesktopNav() {
  return (
    <ul className="flex items-center gap-1">
      {headerGroups.map((group) => (
        <li key={group.label}>
          <button
            type="button"
            popoverTarget={menuId(group.label)}
            className="nav-trigger inline-flex h-9 items-center gap-1.5 rounded-btn px-3 text-small font-medium text-sec transition-colors hover:bg-raised hover:text-text"
          >
            {group.label}
            <CaretDownIcon
              aria-hidden="true"
              className="size-3 transition-transform duration-200"
            />
          </button>
          <div
            id={menuId(group.label)}
            popover="auto"
            className="nav-panel fixed inset-x-0 top-16 mx-auto w-[min(100%-2rem,var(--container-site))] border border-line bg-bg p-0 text-text"
          >
            <div className="grid lg:grid-cols-[1fr_1fr_1fr_1.1fr]">
              {group.links.map((link) => (
                <PopoverLink
                  key={link.href}
                  href={link.href}
                  popoverId={menuId(group.label)}
                  className="group/link flex flex-col gap-3 border-b border-line p-6 transition-colors hover:bg-raised focus-visible:bg-raised lg:border-r lg:border-b-0"
                >
                  <span
                    aria-hidden="true"
                    className="h-0.5 w-6 bg-line-strong transition-colors group-hover/link:bg-signal"
                  />
                  <span className="font-display text-h3 text-text">{link.label}</span>
                  {link.description ? (
                    <span className="text-small text-sec">{link.description}</span>
                  ) : null}
                </PopoverLink>
              ))}
              <PopoverLink
                href={routes.coverageRecord}
                popoverId={menuId(group.label)}
                className="flex flex-col justify-between gap-6 bg-raised p-6 transition-colors hover:bg-panel"
              >
                <span className="text-small font-medium text-sec">
                  Example record · {latest.asset}
                </span>
                <span className="flex items-end justify-between gap-4">
                  <span>
                    <span className="block font-display text-[2.5rem] leading-none num">
                      {coveragePercent(latest.owed, latest.held)}
                    </span>
                    <span className="mt-2 block text-small text-sec">{latest.institution}</span>
                  </span>
                  <StateStamp state={latest.state} />
                </span>
              </PopoverLink>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

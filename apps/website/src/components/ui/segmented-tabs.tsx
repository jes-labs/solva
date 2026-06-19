"use client";

import * as Tabs from "@radix-ui/react-tabs";

export interface TabItem {
  value: string;
  label: string;
}

interface SegmentedTabsProps {
  items: TabItem[];
  // Controlled value. Leave unset to let the component manage its own state.
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

// A segmented control built on Radix Tabs, so it has roving focus and arrow-key
// navigation for free. The active segment uses a panel fill, keeping the accent
// reserved for real signals. Pages render their own panels keyed off the value.
export function SegmentedTabs({
  items,
  value,
  defaultValue,
  onValueChange,
  className,
}: SegmentedTabsProps) {
  // Radix wants either a controlled value or a default, never both.
  const rootProps =
    value !== undefined
      ? { value, onValueChange }
      : { defaultValue: defaultValue ?? items[0]?.value, onValueChange };

  return (
    <Tabs.Root {...rootProps} className={className}>
      <Tabs.List className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Tabs.Trigger
            key={item.value}
            value={item.value}
            className="rounded-lg border border-transparent px-4 py-2.5 text-sm font-semibold text-sec transition-colors hover:text-fg data-[state=active]:border-hair-strong data-[state=active]:bg-panel data-[state=active]:text-fg"
          >
            {item.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}

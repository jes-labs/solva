import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { Step, Steps } from "fumadocs-ui/components/steps";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { TypeTable } from "fumadocs-ui/components/type-table";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { ComingSoon } from "@/components/mdx/coming-soon";
import { DocsHero } from "@/components/mdx/docs-hero";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    Accordion,
    Accordions,
    ComingSoon,
    DocsHero,
    Step,
    Steps,
    Tab,
    Tabs,
    TypeTable,
    ...components,
  };
}

export const useMDXComponents = getMDXComponents;

"use client";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@rocky/ui/components/accordion";
import { Button } from "@rocky/ui/components/button";
import { Badge } from "@rocky/ui/components/badge";

export function RetroPreview() {
  return (
    <div className="grid gap-6 md:grid-cols-2 not-prose">
      {/* CLEAN — the @rocky/ui brand (green/gold, soft radius) */}
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          Clean · @rocky/ui brand
        </h3>
        <Accordion type="single" collapsible className="border rounded-md">
          <AccordionItem value="a">
            <AccordionTrigger>Accordion Item 1</AccordionTrigger>
            <AccordionContent>Clean content area.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>Accordion Item 2</AccordionTrigger>
            <AccordionContent>Clean content area.</AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="flex items-center gap-2">
          <Button>Primary</Button>
          <Badge>Badge</Badge>
        </div>
      </section>

      {/* RETRO — same components, scoped [data-theme="retro"] (hard shadow, sharp corners) */}
      <section data-theme="retro" className="flex flex-col gap-3">
        <h3 className="retro-font text-sm font-semibold text-muted-foreground">
          Retro · scoped variant
        </h3>
        <Accordion
          type="single"
          collapsible
          className="rounded-none border-2 shadow-sm"
        >
          <AccordionItem value="a">
            <AccordionTrigger>Accordion Item 1</AccordionTrigger>
            <AccordionContent>Retro content area.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="b">
            <AccordionTrigger>Accordion Item 2</AccordionTrigger>
            <AccordionContent>Retro content area.</AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="flex items-center gap-2">
          <Button className="rounded-none border-2 shadow-sm">Primary</Button>
          <Badge className="rounded-none border-2 shadow-sm">Badge</Badge>
        </div>
      </section>
    </div>
  );
}

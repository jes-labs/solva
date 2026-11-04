import { pictureCredits } from "@/config/credits";
import { Chapter, ChapterHead } from "@/components/ui/ledger";

export function PictureCredits() {
  return (
    <Chapter
      id="picture-credits"
      labelledBy="picture-credits-title"
      tone="tint"
      className="scroll-mt-14"
    >
      <ChapterHead
        id="picture-credits-title"
        label="Pictures"
        title="Picture credits"
        lead="Every picture on this site is a historical work from a public collection. None of them shows Solva, or any institution that uses it."
      />
      <ul className="mt-12 border-t border-line">
        {pictureCredits.map((credit) => (
          <li
            key={credit.sourceUrl}
            className="grid gap-2 border-b border-line py-4 lg:grid-cols-[1fr_1fr] lg:gap-8"
          >
            <a
              href={credit.sourceUrl}
              className="text-ui font-medium text-link underline decoration-link-line underline-offset-4 hover:decoration-text"
            >
              {credit.title}
            </a>
            <p className="text-small text-sec">
              {credit.creator ? `${credit.creator}. ` : ""}
              {credit.source},{" "}
              <a href={credit.licenceUrl} className="underline underline-offset-2">
                {credit.licence}
              </a>
              .
            </p>
          </li>
        ))}
      </ul>
    </Chapter>
  );
}

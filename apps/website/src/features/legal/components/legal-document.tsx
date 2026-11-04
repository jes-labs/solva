import { site } from "@/config/site";
import { LAST_UPDATED, LEGAL_CONTENTS } from "../lib/contents";
import { LegalContents } from "./legal-contents";
import { LegalSection } from "./legal-section";
import { RecordExample } from "./record-example";
import { TeamEmail } from "./team-email";

const PROCESSORS: readonly { name: string; role: string; data: string }[] = [
  {
    name: "Resend",
    role: "Delivers the emails our forms send to the team",
    data: "Everything you type into a form",
  },
  {
    name: "Cloudflare",
    role: "Hosts this site and protects it from abuse",
    data: "Request details such as IP address, browser and the page asked for",
  },
];

export function LegalDocument() {
  return (
    <section
      aria-label="Terms of use and privacy notice"
      className="grid gap-12 px-5 pb-20 sm:px-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16 lg:px-12"
    >
      <div>
        <LegalContents entries={LEGAL_CONTENTS} />
      </div>
      <div className="min-w-0 max-w-[44rem]">
        <p className="mb-10 font-mono text-micro tracking-[0.06em] text-faint uppercase num">
          Last updated <time dateTime={LAST_UPDATED.iso}>{LAST_UPDATED.label}</time>
        </p>
        <article className="flex min-w-0 flex-col">
          <LegalSection id="who-we-are" title="Who runs this site">
            <p>
              joinsolva.xyz is the website of Solva. In this page, &ldquo;we&rdquo; and
              &ldquo;us&rdquo; mean {site.name}, and &ldquo;you&rdquo; means anyone who visits the
              site or sends us a form.
            </p>
            <p>
              Write to <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> with any
              question about this page.
            </p>
          </LegalSection>

          <LegalSection id="using-this-site" title="Using this site">
            <p>
              This site explains what Solva is and how it works. You may read it, link to it and
              share it. You may not try to break it, overload it, or use our forms to send anything
              unlawful, abusive or automated.
            </p>
            <p>
              Nothing on this site is financial, legal or investment advice. Descriptions of planned
              work are targets, not promises, and they can change.
            </p>
          </LegalSection>

          <LegalSection id="coverage-records" title="Coverage records on this site">
            <p>
              The institutions and figures shown in the interface examples on this site, such as
              Kestrel Anchor or Arden Pay, are fictional. They show how a record looks, not the
              position of any real institution.
            </p>
            <RecordExample />
            <p>
              A real coverage record states whether an institution&rsquo;s reported reserves covered
              what it owed at the last proof. It is evidence that an auditor can check. It is not an
              audit, and it is not a judgement on the quality of an institution or its assets. Read
              a record as of the ledger it names.
            </p>
          </LegalSection>

          <LegalSection id="eligibility" title="Who can register">
            <p>
              Solva is for anchors that issue assets on Stellar and for custodial apps and exchanges
              that hold customer money on it. We do not register institutions or assets where local
              law or our compliance policy does not allow it.
            </p>
            <p>
              Registration will be assessed case by case once self-serve onboarding opens, and we
              may decline or remove an entry when the law or that policy requires it.
            </p>
          </LegalSection>

          <LegalSection id="open-source" title="Open source code and our name">
            <p>
              Solva&rsquo;s code is open source under the Apache License 2.0, published at{" "}
              <a href={site.githubUrl} target="_blank" rel="noreferrer">
                GitHub
              </a>
              . That licence governs the code.
            </p>
            <p>
              The licence does not cover the Solva name, the seal mark or the design of this site.
              Do not use them in a way that suggests we made, checked or approve something we did
              not.
            </p>
          </LegalSection>

          <LegalSection id="responsibility" title="Limits of our responsibility">
            <p>
              We work to keep this site accurate and available, but we provide it as it is. We are
              not responsible for losses that come from relying on its content, from it being
              unavailable, or from sites we link to.
            </p>
            <p>
              Nothing on this page limits any right you have that the law does not allow us to
              limit.
            </p>
          </LegalSection>

          <LegalSection id="what-we-collect" title="What our forms collect">
            <p>This site has two forms. Each one sends us only what you type into it:</p>
            <ul>
              <li>
                <strong className="font-medium">Talk to us</strong>: your name, work email,
                organisation, role, the asset or product if you give one, and your message.
              </li>
              <li>
                <strong className="font-medium">Join the waitlist</strong>: your work email,
                organisation and role.
              </li>
            </ul>
            <TeamEmail />
            <p>
              We do not ask for balances, customer data or keys through these forms. Do not send
              them.
            </p>
          </LegalSection>

          <LegalSection id="why-and-how-long" title="Why we use it and how long we keep it">
            <p>
              We use what you send to reply to you, to plan a pilot with you, and to invite you to
              the console when it opens to your organisation. We do not sell it, and we do not add
              you to a marketing list.
            </p>
            <ul>
              <li>
                Messages are kept for as long as the conversation is active, and deleted within 24
                months of our last exchange.
              </li>
              <li>
                Waitlist requests are kept until the console opens to you or you ask to leave the
                list.
              </li>
            </ul>
            <p>We keep something longer only when the law requires it.</p>
          </LegalSection>

          <LegalSection id="processors" title="Who processes it">
            <p>Two services handle data for us. Each acts on our instructions only.</p>
            <div>
              <table className="w-full border border-line text-left text-small">
                <thead>
                  <tr className="border-b border-line text-sec">
                    <th scope="col" className="px-3 py-2.5 font-medium">
                      Service
                    </th>
                    <th scope="col" className="px-3 py-2.5 font-medium">
                      What it does
                    </th>
                    <th scope="col" className="px-3 py-2.5 font-medium">
                      What it sees
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PROCESSORS.map((processor) => (
                    <tr
                      key={processor.name}
                      className="border-b border-line align-top last:border-b-0"
                    >
                      <th scope="row" className="px-3 py-3 font-medium text-text">
                        {processor.name}
                      </th>
                      <td className="px-3 py-3">{processor.role}</td>
                      <td className="px-3 py-3">{processor.data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Our own team reads form messages in our email inbox. Nobody outside Solva sees them
              unless the law requires it.
            </p>
          </LegalSection>

          <LegalSection id="cookies" title="Cookies and analytics">
            <p>
              This site runs no analytics or advertising scripts and sets no tracking cookies.
              Cloudflare may set a strictly necessary cookie to tell people from automated traffic.
            </p>
          </LegalSection>

          <LegalSection id="your-rights" title="Your rights and requests">
            <p>
              You can ask us to show you what we hold about you, to correct it, to delete it, or to
              stop using it. Write to{" "}
              <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> from the address you
              used, and we will act on it within 30 days.
            </p>
            <p>
              Report a security problem to{" "}
              <a href={`mailto:${site.securityEmail}`}>{site.securityEmail}</a>.
            </p>
          </LegalSection>

          <LegalSection id="changes" title="Changes to this page">
            <p>
              When this page changes, we update the date at the top. If a change affects how we use
              data you already sent, we write to tell you before it takes effect.
            </p>
          </LegalSection>
        </article>
      </div>
    </section>
  );
}

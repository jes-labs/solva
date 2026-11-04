const HEADERS: readonly { label: string; value: string }[] = [
  { label: "From", value: "Solva <hello@send.joinsolva.xyz>" },
  { label: "To", value: "hello@joinsolva.xyz" },
  { label: "Reply to", value: "ines@ardenpay.example" },
  { label: "Subject", value: "Contact: Arden Pay (Custodial app)" },
];

const BODY: readonly string[] = [
  "Name: Ines Arden",
  "Email: ines@ardenpay.example",
  "Organisation: Arden Pay",
  "Role: Custodial app",
  "Asset or product: EURC",
];

export function TeamEmail() {
  return (
    <figure className="my-4">
      <div className="ruled-marks relative max-w-[34rem] border border-line bg-bg p-5 text-text sm:p-6">
        <dl className="grid grid-cols-[5.5rem_1fr] gap-x-4 gap-y-1.5 text-small">
          {HEADERS.map((header) => (
            <div key={header.label} className="contents">
              <dt className="text-sec">{header.label}</dt>
              <dd className="font-mono break-words">{header.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 border-t border-line pt-4 font-mono text-small leading-relaxed">
          {BODY.map((line) => (
            <p key={line}>{line}</p>
          ))}
          <p className="mt-3 font-sans text-text">
            We hold EURC for about 9,000 customers and want to publish coverage each day.
          </p>
        </div>
      </div>
      <figcaption className="mt-3 max-w-[44rem] text-small text-sec">
        The whole message our team receives when you send the contact form. A waitlist request
        carries only the email, organisation and role.
      </figcaption>
    </figure>
  );
}

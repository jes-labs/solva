import { HONEYPOT_FIELD } from "../lib/schema";

export function Honeypot() {
  return (
    <div aria-hidden="true" className="sr-only">
      <label htmlFor={`${HONEYPOT_FIELD}-trap`}>Leave this field empty</label>
      <input
        id={`${HONEYPOT_FIELD}-trap`}
        type="text"
        name={HONEYPOT_FIELD}
        tabIndex={-1}
        autoComplete="off"
        defaultValue=""
      />
    </div>
  );
}

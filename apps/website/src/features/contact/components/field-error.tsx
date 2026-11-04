interface FieldErrorProps {
  id: string;
  message: string | undefined;
}

export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) {
    return null;
  }
  return (
    <p id={id} className="mt-2 flex items-start gap-2 text-small text-short">
      <svg
        aria-hidden="true"
        viewBox="0 0 10 10"
        className="mt-1 size-2.5 flex-none fill-short-fill"
      >
        <path d="M0 1h10L5 9z" />
      </svg>
      {message}
    </p>
  );
}

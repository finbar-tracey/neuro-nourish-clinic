export function FormErrorBanner({ errors }: { errors: Record<string, string> }) {
  const messages = Object.values(errors).filter(Boolean);
  if (messages.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800"
    >
      <p className="font-semibold">Please check the following:</p>
      <ul className="mt-1 list-inside list-disc text-xs leading-relaxed sm:text-sm">
        {messages.map((msg) => (
          <li key={msg}>{msg}</li>
        ))}
      </ul>
    </div>
  );
}

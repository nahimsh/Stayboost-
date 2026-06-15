/**
 * Renders a JSON-LD <script>. Data is server-controlled (never user input), so
 * serializing it into the tag is safe; we still escape `<` to be defensive.
 */
export function JsonLd({ data }: { readonly data: Record<string, unknown> }): React.JSX.Element {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

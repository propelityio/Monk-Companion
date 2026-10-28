/**
 * Shows text word by word as it is spoken. Words up to `spoken` characters fade
 * in from the left; the rest wait, invisible, in their final place (so the
 * layout never jumps). `spoken` undefined means "show everything".
 */
export function RevealText({
  text,
  spoken,
  offset = 0,
}: {
  text: string;
  spoken?: number;
  offset?: number;
}) {
  if (spoken === undefined) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  const re = /\S+|\s+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const token = m[0];
    if (/^\s/.test(token)) {
      parts.push(token);
    } else {
      const shown = offset + m.index < spoken;
      parts.push(
        <span key={m.index} className={shown ? "word word-in" : "word word-out"}>
          {token}
        </span>,
      );
    }
  }
  return <>{parts}</>;
}

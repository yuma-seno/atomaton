/**
 * fence.ts — where in a piece of Markdown the code is.
 *
 * Two questions are asked of a body or a comment written on GitHub, and both come
 * down to "is this prose, or is it code somebody is meant to read":
 *
 *   - a tag inside a code sample is not the machinery speaking, so it must not
 *     decide a parent, a notify target or an ending (`adapters/github/tags.ts`)
 *   - a mention inside code notifies nobody, and wrapping it in backticks would
 *     change the sample (`domain/work/mention.ts`)
 *
 * It was two answers to that. The adapter had `fenceSegments`; the domain had a
 * regex pairing three backticks wherever it found them, which reads a four-backtick
 * fence holding a three-backtick sample — the shape a draft quoting a Markdown file
 * has — as code, prose, code, and escapes a mention inside what GitHub renders as a
 * single code block. This is the one definition, here, so that a third copy cannot
 * appear: `mention.ts`'s `LOGIN_PATTERN` was written out three times and the copies
 * had begun to differ.
 */

export interface TextSegment {
  text: string;
  /** Inside code: a fenced block or an inline span, not prose. */
  code: boolean;
}

/**
 * `text` in alternating runs of prose and fenced code, by CommonMark's rule:
 * a fence opens with at least three backticks or tildes (up to three spaces of
 * indent) and closes with the same character, at least as many of them, and
 * nothing else on the line. A fence never closed runs to the end of the text,
 * which is the safe direction -- the rest is evidence rather than bookkeeping.
 *
 * Backtick fences may not carry backticks in their info string; that rule is what
 * keeps an inline `` `a` `` inside a sentence from opening a block.
 *
 * An inline span is prose here. That is what the tag readers want -- a tag written
 * in a one-line example is still the machinery's word for what the run did -- and it
 * is not what a mention wants, which is why `codeSegments` is the wider one.
 *
 * An indented code block is not recognised, and deliberately: its indent is relative
 * to the enclosing list item, so a list nested by four spaces reads the same as a code
 * block unless a full block parser is here. Guessing wrong in the other direction
 * leaves a mention unescaped and a stranger notified, which is the mistake with no
 * symptom on this side, so the fence -- the unambiguous case -- is the one taken.
 */
export function fenceSegments(text: string): TextSegment[] {
  const lines = text.match(/[^\n]*\n|[^\n]+$/g) ?? [];
  const segments: TextSegment[] = [];
  let open: { char: string; length: number } | null = null;
  let current: TextSegment = { text: "", code: false };

  for (const line of lines) {
    const bare = line.replace(/\r?\n$/, "");
    const fence = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(bare);
    if (open === null) {
      const opens = fence !== null && (fence[1]![0] !== "`" || !fence[2]!.includes("`"));
      if (opens) {
        if (current.text) segments.push(current);
        open = { char: fence[1]![0]!, length: fence[1]!.length };
        current = { text: line, code: true };
      } else {
        current.text += line;
      }
      continue;
    }

    current.text += line;
    if (fence && fence[1]![0] === open.char && fence[1]!.length >= open.length && fence[2]!.trim() === "") {
      segments.push(current);
      current = { text: "", code: false };
      open = null;
    }
  }

  if (current.text) segments.push(current);
  return segments;
}

/**
 * `text` in alternating runs of prose and code, where code is a fenced block or an
 * inline span.
 *
 * A span opens and closes on a run of backticks of the same length, on one line, so
 * `` ``a `b` c`` `` is one span rather than three. A run with no closer on its line is
 * literal text.
 *
 * One line, not one paragraph: a span that reached a line down would be one stray
 * backtick making the next line's `@name` look like code, and a name in code is a
 * name that goes unescaped. Escaping a mention that was inside a hand-written span is
 * the cheap mistake; letting a stranger be notified is the one nobody here learns
 * about.
 *
 * Concatenating the segments gives back `text` byte for byte, which is what lets a
 * caller rewrite only the prose and leave every sample exactly as written.
 */
export function codeSegments(text: string): TextSegment[] {
  return fenceSegments(text).flatMap((segment) => (segment.code ? [segment] : spans(segment.text)));
}

/** A run of prose, split around the inline code spans in it. */
function spans(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let prose = "";
  let at = 0;

  while (at < text.length) {
    if (text[at] !== "`") {
      prose += text[at];
      at += 1;
      continue;
    }
    const opening = runLength(text, at);
    const lineEnd = text.indexOf("\n", at);
    const closing = closingRun(text, at + opening, opening, lineEnd === -1 ? text.length : lineEnd);
    if (closing === -1) {
      // Not a span, so the backticks are text -- and a span may still open after them.
      prose += text.slice(at, at + opening);
      at += opening;
      continue;
    }
    if (prose) segments.push({ text: prose, code: false });
    prose = "";
    segments.push({ text: text.slice(at, closing + opening), code: true });
    at = closing + opening;
  }

  if (prose) segments.push({ text: prose, code: false });
  return segments;
}

/** How many backticks start at `at`. */
function runLength(text: string, at: number): number {
  let length = 0;
  while (text[at + length] === "`") length += 1;
  return length;
}

/** Where the first run of exactly `length` backticks before `end` on the line starts, or -1. */
function closingRun(text: string, from: number, length: number, end: number): number {
  let at = from;
  for (;;) {
    const found = text.indexOf("`", at);
    if (found === -1 || found + length > end) return -1;
    const run = runLength(text, found);
    if (run === length) return found;
    at = found + run;
  }
}

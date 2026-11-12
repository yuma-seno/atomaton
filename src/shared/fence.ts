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
 * A blockquote marker is stepped over before either test, because a fence inside a
 * `>` is still a fence -- GitHub renders `> ``` ` as a code block and notifies
 * nobody from it. Reading it as prose is not the safe direction: it puts backticks
 * inside a sample a person is meant to read, which is the whole failure this module
 * exists to avoid. A quote that ends takes its fence with it, so the lines after a
 * `>` block are prose again.
 *
 * An inline span is prose here. That is what the tag readers want -- a tag written
 * in a one-line example is still the machinery's word for what the run did -- and it
 * is not what a mention wants, which is why `codeSegments` is the wider one.
 *
 * ## A fence indented four spaces
 *
 * Four spaces at the start of a block is an indented code block; the same four
 * spaces after a paragraph line continue that paragraph. The line alone does not
 * say which, so this used to read every indented fence as prose -- which put
 * backticks inside a sample a person had quoted that way, the failure the module
 * exists to prevent.
 *
 * It is now code when the fence PAIRS UP and STARTS A BLOCK: a closing fence
 * follows before the indented block ends, and the line before the opener is blank,
 * ends a block, or enters a blockquote. That is the shape a comment quoting a
 * sample has, at the top level, under a list item and inside a quote --
 * `    ```` ` opening and `    ```` ` closing -- and GitHub renders it as one code
 * block, so reading it as prose is wrong in all of this module's uses.
 *
 * What is still prose, and why the rule stops there:
 *
 *   - an indented fence that continues a paragraph. An indented block cannot
 *     interrupt a paragraph, so `prose` followed directly by `    ```` ` is
 *     paragraph text on GitHub, and escaping a mention in it is the cheap mistake.
 *   - an indented code block with no fence markers. The same four spaces after a
 *     list item's `1. ` are that item's continuation paragraph, and deciding needs
 *     the item's content column; guessing "code" there would leave a mention
 *     unescaped.
 *
 * Both residuals are pinned in `fence.test.ts`. The remaining ranking is unchanged:
 * escaping a name that was already safe costs a comment that reads oddly, while
 * leaving one unescaped notifies a stranger and leaves no trace here.
 */
export function fenceSegments(text: string): TextSegment[] {
  const lines = text.match(/[^\n]*\n|[^\n]+$/g) ?? [];
  const segments: TextSegment[] = [];
  let open: { char: string; length: number; depth: number; indent: number | null } | null = null;
  let current: TextSegment = { text: "", code: false };
  /** Whether the line before ended a block, so this one may start a new one. */
  let startsBlock = true;
  /** The blockquote depth of the line before. */
  let previousDepth = 0;

  const flush = (): void => {
    if (current.text) segments.push(current);
    current = { text: "", code: false };
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!;
    const bare = line.replace(/\r?\n$/, "");
    // The quote depth the line is written at, and its text with every marker gone.
    const { depth, rest } = stripQuotes(bare, Number.POSITIVE_INFINITY);
    // Entering a blockquote starts a block in it: `>     ```` ` is the opening line
    // of an indented code block, not the continuation of the paragraph outside the
    // quote.
    if (depth > previousDepth) startsBlock = true;
    previousDepth = depth;

    if (open !== null && depth < open.depth) {
      // The blockquote the fence opened in has ended, and a fence ends with its container.
      flush();
      open = null;
      startsBlock = true;
    }

    if (open === null) {
      const fence = FENCE.exec(rest);
      if (fence !== null && (fence[1]![0] !== "`" || !fence[2]!.includes("`"))) {
        flush();
        open = { char: fence[1]![0]!, length: fence[1]!.length, depth, indent: null };
        current = { text: line, code: true };
        startsBlock = false;
        continue;
      }

      const indented = INDENTED_FENCE.exec(rest);
      const opensIndented =
        indented !== null &&
        startsBlock &&
        (indented[2]![0] !== "`" || !indented[3]!.includes("`")) &&
        hasIndentedCloser(lines, index, depth, indented[1]!.length, indented[2]!);
      if (opensIndented) {
        flush();
        open = {
          char: indented[2]![0]!,
          length: indented[2]!.length,
          depth,
          indent: indented[1]!.length,
        };
        current = { text: line, code: true };
        startsBlock = false;
        continue;
      }

      current.text += line;
      // A fence-looking line that continues a paragraph is paragraph text, so the
      // paragraph is not over. Anything else follows the ordinary block rules.
      startsBlock = indented !== null && !startsBlock ? false : endsBlock(rest);
      continue;
    }

    current.text += line;
    if (closesFence(stripQuotes(bare, open.depth).rest, open)) {
      flush();
      open = null;
      startsBlock = true;
    }
  }

  flush();
  return segments;
}

/** A fence line, once the blockquote markers in front of it are gone. */
const FENCE = /^ {0,3}(`{3,}|~{3,})(.*)$/;

/** A fence line indented enough to be an indented code block, and its indent. */
const INDENTED_FENCE = /^( {4,})(`{3,}|~{3,})(.*)$/;

/** An ATX heading: the line starts a block, so the next line may too. */
const ATX_HEADING = /^ {0,3}#{1,6}(?:[ \t]|$)/;

/** A thematic break: a block of its own. */
const THEMATIC_BREAK = /^ {0,3}(?:(?:\*[ \t]*){3,}|(?:-[ \t]*){3,}|(?:_[ \t]*){3,})$/;

/** A list item marker: the item's content starts a paragraph. */
const LIST_ITEM = /^ {0,3}(?:[-+*]|\d{1,9}[.)])(?:[ \t]+|$)/;

/**
 * Whether `rest` ends the block it is on, so the next line may start a new one.
 *
 * A blank line, a heading, a thematic break and a list marker each do. So does a
 * fence line: a fence is a block of its own whether this module reads it as code
 * or (unpaired) as prose. Everything else is paragraph text, and an indented block
 * cannot interrupt a paragraph.
 */
function endsBlock(rest: string): boolean {
  if (rest.trim() === "") return true;
  return (
    ATX_HEADING.test(rest) ||
    THEMATIC_BREAK.test(rest) ||
    LIST_ITEM.test(rest) ||
    FENCE.test(rest) ||
    INDENTED_FENCE.test(rest)
  );
}

/** Whether `rest` closes the fence `open`. */
function closesFence(
  rest: string,
  open: { char: string; length: number; depth: number; indent: number | null },
): boolean {
  // An indented opener is only closed by an indented closer. Accepting an
  // unindented one as well would read the prose between them as code -- the
  // direction that notifies a stranger -- and a pair written at one indent is
  // the shape this rule is for.
  if (open.indent === null) {
    const normal = FENCE.exec(rest);
    return (
      normal !== null &&
      normal[1]![0] === open.char &&
      normal[1]!.length >= open.length &&
      normal[2]!.trim() === ""
    );
  }
  const indented = INDENTED_FENCE.exec(rest);
  if (indented === null) return false;
  const indent = indented[1]!.length;
  return (
    indent >= 4 &&
    indent <= open.indent + 3 &&
    indented[2]![0] === open.char &&
    indented[2]!.length >= open.length &&
    indented[3]!.trim() === ""
  );
}

/**
 * Whether a closing fence for the candidate opener at `opener` follows in the same
 * block, before the blockquote it opened in ends.
 */
function hasIndentedCloser(
  lines: string[],
  opener: number,
  depth: number,
  indent: number,
  marker: string,
): boolean {
  for (let index = opener + 1; index < lines.length; index += 1) {
    const bare = lines[index]!.replace(/\r?\n$/, "");
    const { depth: lineDepth, rest } = stripQuotes(bare, depth);
    if (lineDepth < depth) return false;
    // A non-blank line out at the margin ends the indented block, so a fence below
    // it opens a new block rather than closing this one. Reading across it would
    // call the line's prose code and leave a mention in it unescaped.
    if (rest.trim() !== "" && rest.length - rest.trimStart().length < indent) return false;
    if (closesFence(rest, { char: marker[0]!, length: marker.length, depth, indent })) return true;
  }
  return false;
}

/**
 * How deep in a blockquote `line` sits, and the line with that many `>` markers and
 * their optional trailing space removed.
 *
 * `limit` stops the peel early, which is how a line inside a blockquote is read at
 * the depth the fence opened at -- one level deeper and a `>` written inside the
 * sample would be mistaken for the quote's own marker.
 */
function stripQuotes(line: string, limit: number): { depth: number; rest: string } {
  let rest = line;
  let depth = 0;
  while (depth < limit) {
    const marker = /^ {0,3}> ?/.exec(rest);
    if (marker === null) break;
    rest = rest.slice(marker[0].length);
    depth += 1;
  }
  return { depth, rest };
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

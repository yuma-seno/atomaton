/**
 * comment-body.ts — which characters of ONE comment a read returns, and the line
 * that says how to read the next part.
 *
 * `get_issue_comments` caps how much of each comment enters the session, because
 * a tool result is resent on every later inference and a comment with a log
 * pasted into it is rent charged for the rest of the issue's life. The cap was a
 * fixed fifth of the tool budget, and its marker named the count it had dropped
 * and nothing else — so everything past the first 1,600 characters was
 * unreadable THROUGH the tool. On #149 that tail is where the decision was, and
 * the only way to it was to leave the tool and fetch the comment's REST URL by
 * hand, which is a call no agent should need to know about to read a comment.
 *
 * `files/read` already settles the shape: take an offset, and name the offset
 * that continues, in the text where the cut is. The unit here is a character
 * offset rather than a line number because a comment has none the caller could
 * count.
 *
 * The alternative — a bigger cap — is not available. The budget covers the whole
 * result and several comments come back at once, so raising one comment's share
 * pushes the result past what the session should pay for; and any cap at all is
 * a number some comment exceeds. A continuation has no ceiling.
 */

/** One part of a comment's body, and how to read the part after it. */
export interface CommentBodySegment {
  /** The characters to return, with any marker saying what was left out. */
  text: string;
  /** The `body_offset` that reads the next part. Absent when this part reaches the end. */
  next?: number;
}

export interface CommentBodyOptions {
  /** The comment's number in the issue, as `from` and the header report it. */
  index: number;
  /** How many characters this part, markers included, may occupy. */
  budget: number;
  /** 0-based character offset to start at. The value a previous cut named. */
  offset?: number;
}

/**
 * Read one part of a comment body, starting at `offset`.
 *
 * The marker lives in the text rather than only in a sibling field, for the reason
 * `capText`'s does: a sibling field is what a caller forgets to read, and a cut
 * that looks complete is how an agent concludes a decision is absent when it was
 * merely past the cut. The marker additionally names the exact call that reads
 * the rest, so the tail is reachable without a second question.
 *
 * `offset` is assumed to be inside the body; the tool validates it against the
 * length it read, because only the tool can say which comment the caller meant
 * and refuse with the length in the message.
 */
export function readCommentBody(body: string, options: CommentBodyOptions): CommentBodySegment {
  const { index, budget, offset = 0 } = options;
  const start = offset;
  const remaining = body.length - start;

  // Where this part begins. A continuation says so, or a reader cannot tell the
  // middle of a comment from its opening — the same confusion, the other way
  // round, as a cut that reads as the end. The final part says it is the final
  // one, so the end of a body is stated rather than inferred from the absence of
  // a marker.
  const prefix = (last: boolean) =>
    start === 0
      ? ""
      : `\n[continuing comment ${index} at character ${start + 1} of ${body.length}` +
        `${last ? "; this is the last part" : ""}]\n`;

  if (prefix(true).length + remaining <= budget) {
    return { text: `${prefix(true)}${body.slice(start)}` };
  }

  const marker = (shown: number) =>
    `\n\n[${start + shown} of ${body.length} characters shown; ${remaining - shown} dropped from the end. ` +
    `Read the rest with from: ${index}, body_offset: ${start + shown}]`;

  // The marker is inside the budget, not on top of it — the same arithmetic as
  // `capText`, and for the same reason: a result over its budget is cut again on
  // the way into the session, and the second cut lands inside a note that was
  // supposed to say what was missing. Both numbers in the note can be at their
  // widest independently, so the reservation uses each number's own maximum:
  // the position never passes the length, and the dropped count never passes what
  // is left.
  const longest =
    `\n\n[${body.length} of ${body.length} characters shown; ${remaining} dropped from the end. ` +
    `Read the rest with from: ${index}, body_offset: ${body.length}]`;
  // At least one character is always shown, so a budget too small to hold the note
  // cannot loop forever returning the same offset. The callers here floor the
  // budget well above the note's length, so the overrun this could cause does not
  // arise.
  const room = Math.max(1, budget - prefix(false).length - longest.length);
  const shown = Math.min(remaining, room);

  return { text: prefix(false) + body.slice(start, start + shown) + marker(shown), next: start + shown };
}

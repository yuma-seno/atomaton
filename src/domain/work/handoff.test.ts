import { describe, expect, test } from "bun:test";
import { decidePostMergeHandoff, decideRejectionHandoff } from "./handoff.ts";

describe("decidePostMergeHandoff", () => {
  test("no-parent when the PR has no linked parent issue", () => {
    expect(
      decidePostMergeHandoff({ parentIssue: undefined, parentAlreadyClosed: false, originAgent: undefined }),
    ).toEqual({ kind: "no-parent" });
  });

  test("already-closed when the parent is already closed, even if an origin agent is tagged", () => {
    expect(
      decidePostMergeHandoff({ parentIssue: 5, parentAlreadyClosed: true, originAgent: "engineer" }),
    ).toEqual({ kind: "already-closed", parentIssue: 5 });
  });

  test("reinvoke-origin-agent when an origin agent is tagged and the parent is still open", () => {
    expect(
      decidePostMergeHandoff({ parentIssue: 5, parentAlreadyClosed: false, originAgent: "engineer" }),
    ).toEqual({ kind: "reinvoke-origin-agent", parentIssue: 5, agent: "engineer" });
  });

  test("close-directly when there is no origin agent tag", () => {
    expect(
      decidePostMergeHandoff({ parentIssue: 5, parentAlreadyClosed: false, originAgent: undefined }),
    ).toEqual({ kind: "close-directly", parentIssue: 5 });
  });

  test("already-closed takes priority over no origin agent too", () => {
    expect(
      decidePostMergeHandoff({ parentIssue: 5, parentAlreadyClosed: true, originAgent: undefined }),
    ).toEqual({ kind: "already-closed", parentIssue: 5 });
  });
});

describe("decideRejectionHandoff", () => {
  test("nothing (no-parent) when the pull request has no linked issue", () => {
    expect(
      decideRejectionHandoff({ parentIssue: undefined, parentAlreadyClosed: false, originAgent: undefined }),
    ).toEqual({ kind: "nothing", why: "no-parent" });
  });

  test("nothing (already-closed) when the issue is closed -- the person is saying it is finished", () => {
    expect(
      decideRejectionHandoff({ parentIssue: 5, parentAlreadyClosed: true, originAgent: "engineer" }),
    ).toEqual({ kind: "nothing", why: "already-closed" });
  });

  test("returns the close to the origin agent when the issue is still open", () => {
    expect(
      decideRejectionHandoff({ parentIssue: 5, parentAlreadyClosed: false, originAgent: "engineer" }),
    ).toEqual({ kind: "reinvoke-origin-agent", parentIssue: 5, agent: "engineer" });
  });

  test("nothing (no-origin-agent) for a pull request no run of ours opened", () => {
    expect(
      decideRejectionHandoff({ parentIssue: 5, parentAlreadyClosed: false, originAgent: undefined }),
    ).toEqual({ kind: "nothing", why: "no-origin-agent" });
  });

  test("already-closed wins over no origin agent too", () => {
    expect(
      decideRejectionHandoff({ parentIssue: 5, parentAlreadyClosed: true, originAgent: undefined }),
    ).toEqual({ kind: "nothing", why: "already-closed" });
  });

  /**
   * The reason this is its own decision and not `decidePostMergeHandoff` with a
   * flag: the same "no origin agent" input sends the merge route to
   * `close-directly` and the rejection route to nothing. Pinning both sides of
   * that fact so a refactor cannot quietly make them agree.
   */
  test("the no-origin-agent default is the merge route's opposite", () => {
    expect(decidePostMergeHandoff({ parentIssue: 5, parentAlreadyClosed: false, originAgent: undefined })).toEqual({
      kind: "close-directly",
      parentIssue: 5,
    });
    expect(decideRejectionHandoff({ parentIssue: 5, parentAlreadyClosed: false, originAgent: undefined })).toEqual({
      kind: "nothing",
      why: "no-origin-agent",
    });
  });
});

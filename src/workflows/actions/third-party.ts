/**
 * third-party-actions.ts — Typed wrappers for third-party actions we use
 * that aren't (yet) in the public `@github-actions-workflow-ts/actions`
 * registry.
 */
import { CustomAction, type StepBaseProps } from "./base.ts";

export interface SetupBunInputs {
  "bun-version"?: string;
}

/**
 * Pinned, and not "latest", on purpose. `latest` makes every run resolve and
 * download the current release from the GitHub CDN before anything can start,
 * and when the CDN blips (HTTP 504, seen twice on 2026-11-08) every machinery
 * workflow fails with it -- entry, runs, deploy, PR close, the watch sweep. A
 * pin is cacheable by setup-bun, so one successful download serves the rest,
 * and the version moves only when somebody moves it here.
 */
const BUN_VERSION = "1.4.2";

export class SetupBunAction extends CustomAction<SetupBunInputs> {
  constructor(props: StepBaseProps & { with?: SetupBunInputs } = {}) {
    super("oven-sh/setup-bun@v2", { ...props, with: { "bun-version": BUN_VERSION, ...props.with } });
  }
}

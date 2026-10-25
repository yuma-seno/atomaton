# Let agents merge their own pull requests

```yaml
merge:
  policy: auto
```

`manual` is the shipped default and it means an agent never merges into the base
branch. `auto` means it may, when nothing else objects — `merge.governed_paths`,
`merge.gates` and whatever GitHub's own ruleset requires all still apply, and any one
of them firing puts the merge back in a person's hands. `manual` and the two gates
describe the merge into the base branch, so a sub-issue's pull request — which merges
into its parent issue's branch — is not stopped by them; the parent's own pull request
is where the change meets them. How those members compose is in
[the pull request reference](../reference.md#merge).

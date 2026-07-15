# Contributing

Thanks for considering a contribution. This is a small project — the process is lightweight.

## How to contribute

1. **Check existing issues** on [Codeberg](https://codeberg.org/ConsentTheater/website/issues) first. If your idea or bug isn't listed, open one.
2. **Fork the repo** on Codeberg (or use the GitHub mirror — but Codeberg is canonical).
3. **Create a branch** from `main`: `git checkout -b fix-typo-in-handbook` — keep branch names short and descriptive.
4. **Make your change.** Touch only what the task needs. No drive-by refactors.
5. **Verify locally:**
   ```sh
   npm install
   npm run typecheck
   npm run build
   ```
   Both must pass. If `typecheck` or `build` fails, fix it before pushing.
6. **Open a pull request** to `main`. Use the [PR template](.github/PULL_REQUEST_TEMPLATE.md) — it has the checklist and CLA acceptance line.
7. **Wait for review.** A maintainer will look at it. We're volunteers, so it may take a day or two.

## What we accept

- Bug fixes, accessibility improvements, typo corrections — always welcome.
- New handbook articles or law references — please open an issue first to discuss scope.
- Tracker data corrections — those go in the [playbill](https://codeberg.org/ConsentTheater/playbill) repository, not here.
- New features — open an issue first. This is a non-commercial project; we add features that fit the mission, not every good idea.

## What we don't accept

- Third-party scripts, analytics, external fonts, or anything that phones home.
- Changes that break the zero-tracking guarantee (no external requests from the site itself).
- Dependency additions without justification — keep the bundle small.

## Code style

- TypeScript + Astro. Follow the patterns already in the file you're editing.
- Tailwind classes for styling. Use design tokens (`hsl(var(--...))`), not raw colors.
- No comments explaining *what* the code does — the code should say that. Comments only for *why*, when it's non-obvious.
- Keep diffs small. One PR per concern.

## CLA

External contributions require the [CLA](./CLA.md).

Copy this line into the PR description:

```text
I have read and agree to the CLA.
```

No signature bot — that line in the PR body is the acceptance. Maintainers will not merge without it.

## Project facts

- License of this repo: AGPL-3.0-or-later
- Contact: developer@consenttheater.org
- Primary forge: Codeberg (`codeberg.org/ConsentTheater/website`)
- GitHub mirror: `github.com/ConsentTheater/website` (read-only mirror — issues and PRs are auto-closed, use Codeberg)
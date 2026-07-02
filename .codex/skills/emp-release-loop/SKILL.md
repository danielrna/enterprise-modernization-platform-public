---
name: emp-release-loop
description: Use for repetitive Enterprise Modernization Platform benchmark evidence, release publishing, Docker/GitHub release verification, GitHub Pages recovery, and private milestone logging.
---

# EMP Release Loop

Use this skill in `enterprise-modernization-platform` when asked to continue the master plan, grow benchmark evidence, publish a release, fix Pages deployment, or repeat the EMP release checklist.

## Core Loop

1. Inspect state:
   - `git status --short`
   - `reports/benchmark-publish-summary.json`
   - current `package.json` version and latest `features/catalog.json` release.
2. Promote evidence:
   - Use `node ./scripts/benchmark-publish.js --source clone --only <slug> --validate --validation-timeout-ms 120000 --min-count 75`.
   - If host Maven/Gradle is missing, rerun validation inside the latest Docker image with `--source local`.
   - Preserve honest failure/timeout/dependency evidence; do not downgrade existing checkout-backed or passing evidence silently.
3. Package a release only when evidence or docs are publishable:
   - Update `package.json`, `src/cli.js`, `src/mcp.js`, `src/hub.js`, README current references, `CHANGELOG.md`, `features/catalog.json`, and release-note tests.
   - Regenerate with `node ./scripts/benchmark-publish.js --min-count 75`.
4. Verify:
   - `npm run check`
   - `npm run release:verify`
5. Publish:
   - Commit and push `main`.
   - Tag and push `vX.Y.Z`.
   - Build/push `danielrna/enterprise-modernization-platform:vX.Y.Z`.
   - Create GitHub release from `docs/release-notes/vX.Y.Z.md` with smoke and consultant artifacts.
6. Verify public surfaces:
   - `gh release view vX.Y.Z --json tagName,name,url,assets`
   - Docker manifest digest.
   - Pages URLs for release notes, changed benchmark reports, and relevant hub pages.

## GitHub Pages Notes

The repo publishes public static docs from a `gh-pages` branch. If Pages workflow fails around `actions/deploy-pages`, bypass it by keeping `.github/workflows/pages.yml` as a docs-subtree publisher:

```bash
git subtree split --prefix docs -b gh-pages-publish
git push origin gh-pages-publish:gh-pages --force
git branch -D gh-pages-publish
```

If a Pages deployment lock blocks new deploys, cancel the stale Pages deployment by SHA:

```bash
gh api --method POST repos/danielrna/enterprise-modernization-platform/pages/deployments/<sha>/cancel
```

## Milestones

Update `/Users/danielrna/IdeaProjects/emp-project/emp-private-notes/milestones.md` after published releases or significant deployment fixes. That file is local/private and outside the product repo; do not expect it to be committed with product changes.

## Finish Criteria

Before calling the loop complete:

- Product repo is clean.
- Release tag, Docker image, GitHub release, and public Pages URLs are verified when a release was published.
- Private milestones are updated locally when relevant.

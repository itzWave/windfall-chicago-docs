# WindFall Chicago 1.0

Custom static documentation for the WindFall Chicago serious roleplay server. Fourteen individual category pages, a landing page, responsive sidebar, and browser-local full-text search.

## Update rules

Edit `content/rules.json`. Each category has a stable `slug`, `title`, `source`, and an ordered list of `blocks`. Blocks use `type: "rule"` or `type: "paragraph"` and a `text` value. Preserve requirements and punishments when editing. Adding a category automatically adds its page, navigation, card, and search entries.

Run `node build.mjs` to rebuild `dist/`. Push to `main` to deploy through `.github/workflows/pages.yml`. The repository's Pages publishing source must be GitHub Actions.

## Source fidelity

Policy text is transcribed from WindFall Rules.pdf (5 pages) and WindFall Leveling System.pdf (1 page). Only PDF line wrapping, bullet presentation, and decorative leveling icons were removed. Original headings and wording, including spelling and the reference to "Lakeshore", remain unchanged. No donor terms are included. Do not publish the excluded PDF.

The leveling source does not specify cooldown duration, cash bonus amounts, or reward levels; this website does not invent them. Level 10 unlocks an application, not an automatically granted license.

No build dependencies, analytics, or server services are required. Google Fonts is optional; system fonts are used if unavailable. Site-relative links support GitHub Pages project repositories without a custom domain.

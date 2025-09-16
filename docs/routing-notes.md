# Next.js Routing Plan (example)

- `/` → Home (left pane summary + hero + notices)
- `/info/[slug]` → Content pages for left-pane items
- `/offerings/[tab]` → Category landing (from top tabs)
- `/offerings/[tab]/[child]` → Specific service/dealer/manufacturer page

Utilities:
- `lib/menu.ts` → read and transform `sitemap.json`
- `components/LeftPane.tsx` → Accordion nav
- `components/TopTabs.tsx` → Accessible menu (Arrow keys, ESC, FocusTrap)
- `components/Breadcrumbs.tsx` → Derived from route params

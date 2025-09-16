# UI Tokens & Government UX Guidelines

## Tokens (Tailwind-friendly)
- Colors (examples – tune to brand):
  - `--bg: #ffffff`, `--bg-muted: #f6f7fb`
  - `--text: #0b1220`, `--text-muted: #3a4763`
  - `--primary: #0a5ad4`, `--primary-foreground: #ffffff`
  - `--accent: #1a8f5b`, `--warning: #c47f1c`, `--danger: #b42318`
  - `--border: #e1e6ef`, `--ring: #0a5ad4`
- Spacing scale (rem): 0, .25, .5, .75, 1, 1.5, 2, 3, 4, 6, 8
- Radius: none, sm, md, lg, xl, 2xl
- Typography: Base 16px, headings 1.25/1.5/2rem, line-height 1.6 body, 1.2 headings.

## Layout
- Max content width 1200–1280px with 24px gutters.
- Sticky header; persistent language switcher; prominent search.
- Left Pane: accordion with section anchors; keep click targets >= 44×44px.
- Top Tabs: dropdown/mega menu with clear group headings; hover + focus-open; ESC to close.

## Content
- Use plain language, short paragraphs, and bulleted lists.
- Date and phone formats localized; avoid jargon.
- Each page template includes: title, brief summary, primary action(s), related links, contact.

## Patterns
- NoticeBanner for announcements.
- ContactCard for departments/offices.
- ServiceList with filters (department, category, alphabetical).

## Motion
- Minimal, functional only (dropdowns, accordions). 150–200ms; disable on reduced motion.

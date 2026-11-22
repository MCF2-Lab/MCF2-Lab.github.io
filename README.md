# MCF2 Lab website

Source of <https://mcf2-lab.github.io>, the website of the Multiphase and Complex Fluids Flow (MCF2) Lab at California State University, Long Beach.

The site is built by GitHub Pages with Jekyll. Pushing to `master` publishes it; there is no separate build step.

## Where things live

| To change | Edit |
|---|---|
| A news item | add a file to `_news/` (see below) |
| An outreach story | add a file to `_outreach/` |
| Funded projects (Home and Research) | `_data/projects.yml` |
| Research themes | `_data/themes.yml` |
| Publications, talks, software | `_data/publications.yml` |
| Current members and alumni | `_data/team.yml` |
| Courses, ratings, teaching practices | `_data/teaching.yml` |
| Grants list | `_data/funding.yml` |
| Gallery on the Research page | `_data/gallery.yml` |
| Open positions on Join Us | `_data/openings.yml` |
| Menu | `_data/navigation.yml` |
| Contact, profile links (Scholar, ORCID) | `_config.yml` |
| Page text | `_pages/` |
| Look and feel | `assets/css/lab.css`, `assets/js/lab.js` |

## Adding a news item

Create `_news/YYYYMMDD-news-N.md`:

```markdown
---
title: "Congratulations to Jane Doe on her graduation!"
collection: news
permalink: /news/news-2026-12-15/
venue: "Graduation"        # Graduation | Conference | Scholarship and Awards | Outreach activities
date: 2026-12-15
image: "/images/20261215-jane-doe.jpg"   # optional; used on the news cards
---

Text of the news item.

![Jane Doe at graduation](/images/20261215-jane-doe.jpg)
```

Every `permalink` must be unique and end with `/`. When two items share a date, add `-01`, `-02`.

Resize photos before adding them (about 1600 px on the long side, JPEG). Phone photos of 5 to 15 MB slow the site down for everyone.

## Adding a publication

Add an entry at the top of the right list in `_data/publications.yml`. Mark lab students with `{G}` or `{UG}` after their name; the PI's name is bolded automatically. The counters on the Home and Publications pages update on their own.

## Previewing locally

```sh
bundle install
bundle exec jekyll serve
```

Then open <http://localhost:4000>.

## Credits

Visualizations are from the lab's simulations. Fonts: Inter and Source Serif 4 (SIL Open Font License), served by Google Fonts.

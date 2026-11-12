# Visual design

Written 11 November 2026. These are the visual rules for the Founders client. Screen structure lives in [FRONTEND_ARCHITECTURE.md](../architecture/FRONTEND_ARCHITECTURE.md). The finding layers these rules have to keep apart are defined in [EVALUATION_CRITERIA.md](../ai/EVALUATION_CRITERIA.md).

`frontend/src/styles.css` declares the tokens and the three styles. `frontend/src/app/app.css` uses those tokens for the shell. Feature templates use Title on `h1` and the product mark, Text for prose, and the `data` class for values a founder checks.

## Four rules

1. The interface uses three typographic styles: Title, Text, and Data. A fourth family, size, or weight is not part of the design.
2. Color is a token. A feature stylesheet references `var(--ink)`, `var(--ink-muted)`, `var(--paper)`, `var(--surface)`, or `var(--line)`. A hex, `rgb()`, `hsl()`, or named color in a feature stylesheet is a defect.
3. Surfaces are flat. The product does not use a gradient. Purple, violet, and indigo are not in the palette, including as a gradient stop.
4. A button corner is the token `--corner`. A feature stylesheet does not set `border-radius`.

## Typography

One serif stack carries reading. One monospace stack carries values a founder checks against a source. Both are system fonts. The product does not load a webfont.

| Style | Stack | Size | Weight | Used for |
| --- | --- | --- | --- | --- |
| Title | `Georgia, "Times New Roman", serif` | `1.5rem` | `700` | The page `h1`, and the "Founders" mark in the shell header |
| Text | `Georgia, "Times New Roman", serif` | `1rem` | `400` | Navigation, labels, controls, paragraphs, and section headings (`h2`) |
| Data | `ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace` | `1rem` | `400` | Job status, `verification_status`, `original_reference`, `retrieved_at`, and Census counts |

`frontend/src/styles.css` is the only file that sets `font-family`, `font-size`, and `font-weight`. It assigns Title to `h1` and the product mark, Text to `body`, and Data to the `.data` class. Controls use `font: inherit`, so a button, input, and textarea stay Text. A component that needs Data adds `class="data"` to the value. It does not restyle the value.

Section headings stay Text. A finding is separated by its heading words ("Factual summary", "Supporting evidence", "AI interpretation", "Unknowns") and by the document outline, at the same size as the paragraph under it. A larger `h2` would be a fourth style.

Line length for reading and for fields stays `min(40rem, 100%)`, which `styles.css` already uses on inputs and textareas. Paragraphs use the same measure. The shell padding stays `1.5rem`. Those two lengths are layout, not new type styles.

## Color

The five colors already in the stylesheets become the only palette. They describe paper and ink. They are declared once, in the same block as the corner token:

```css
:root {
  --ink: #1c1917;
  --ink-muted: #57534e;
  --paper: #f6f3ee;
  --surface: #ffffff;
  --line: #e7e0d6;
  --corner: 0.65rem;
}
```

| Token | Role |
| --- | --- |
| `--ink` | Text, Title, Data, and the focus outline |
| `--ink-muted` | Secondary sentences: the interpretation caveat, source limits, and empty states |
| `--paper` | Page background |
| `--surface` | Finding layer, form, and header background |
| `--line` | Borders and the header rule |

`color`, `background`, `background-color`, `border-color`, `outline-color`, `fill`, and `stroke` use one of those variables. `#fff` in a feature file is the same defect as a new hex. A new hue, including a status red or a success green, is added by naming a token in this document first. A component does not invent one.

Focus is a `2px` solid `var(--ink)` outline, offset by `2px`. The outline replaces a colored glow.

Each finding layer uses `--surface` and `--line`. The caveat under AI interpretation, and the Census limit under unknowns, use `--ink-muted`. Fact, interpretation, and unknowns stay distinct because their headings and caveat sentences differ. They do not get a private background color.

`verification_status` and job status stay Data, printed as the API value (`UNREVIEWED`, `CONFIRMED`, `REJECTED`, `PENDING`, `RUNNING`). A colored pill is a new color and a new style, so it is outside this design.

## Shape

A button is the only curved surface. `--corner` in the block above is the radius.

`frontend/src/styles.css` sets `border-radius: var(--corner)` on `button`, with `0.45rem 0.9rem` padding so the curve stays clear of the label. The shell sign-in control and the Google sign-in control use the same token, because each is drawn as a button. A form, a finding layer, an input, and a textarea stay square, so a curved edge means an action.

A radius large enough to make a capsule is a different shape. It is outside this design, the same way a colored pill is.

## What was rejected

A display webfont, a sans-serif UI face, and a third size for section headings. Three styles are enough for a page title, prose, and a value that must be checked against a citation. Another face would make the shell look like a different product from the finding.

Purple-to-blue gradients, violet mesh backgrounds, glass panels, and glow. Those treatments decorate a generated-idea product. This product is a record of what a source said, what the model added, and what is still unknown. Flat paper and ink keep a Census count from looking like a recommendation.

Per-layer theme colors, confidence meters, and score bars. [EVALUATION_CRITERIA.md](../ai/EVALUATION_CRITERIA.md) forbids treating a model score as `verification_status`. A bar or a green badge would show that score in visual form.

Dark mode. A second palette would double the tokens before the five above are the only colors in the stylesheets.

## Where this lands in the client

`frontend/src/styles.css` owns `:root`, the three styles, and the button corner. `frontend/src/app/app.css` and feature stylesheets consume the tokens. Feature CSS keeps layout: the finding regions, the form, and the shell. It does not add a type style, a color literal, or its own corner radius.

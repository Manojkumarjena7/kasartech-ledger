# Ledger — Personal Finance Tracker

A minimal, offline personal finance dashboard. No login, no backend, no build step — just open `index.html` and start tracking. Every entry is saved straight to your browser's `localStorage`.

## Running it

There's nothing to install. Either:

- Double-click `index.html` to open it in your browser, or
- Serve the folder locally for a nicer experience with a real URL, e.g. `npx serve .` or `python3 -m http.server`, then visit the printed address.

Chart.js is loaded from a CDN, so an internet connection is needed for the Analytics charts to render — everything else works fully offline.

## Project structure

```
finance-tracker/
├── index.html   # markup for every section, modal, and the mobile nav
├── style.css    # design tokens, layout, calendar heatmap, dark mode, print styles
├── script.js    # state, rendering, calculations — organized into numbered modules
└── README.md
```

`script.js` is split into clearly labeled sections (constants, state, utilities, CRUD, calendar, charts, exports, init) rather than separate files, since the brief asked for a single `script.js`.

## Data model

Everything lives under one `localStorage` key (`ledger_app_data_v1`) as structured JSON:

```js
{
  transactions: [{ id, date, amount, type, category, method, notes, createdAt, recurringId? }],
  loans:        [{ id, type, person, amount, paid, interest, dueDate, notes, createdAt }],
  recurring:    [{ id, name, amount, category, method, dayOfMonth, active, lastGeneratedMonth }],
  settings:     { theme, currency, monthlyBudget }
}
```

### A note on Transfer / Receive

The brief's transaction fields cover one payment method per entry, with no separate "from/to" pair. So **Transfer** is treated as money leaving the selected method (it affects that method's balance but isn't counted as spending), and **Receive** is money arriving into the selected method (it affects the balance but isn't counted as income). This keeps balances accurate without inventing fields the form doesn't have.

### Cash Balance & Loan Balance

- **Cash balance** is a running total for the "Cash" method specifically: income/receive add to it, expense/transfer subtract from it.
- **Loan balance** on the dashboard is net: (loans given − paid back to you) minus (loans taken − paid back by you). A positive number means you're owed money overall.

## Feature map

| Section | What's there |
|---|---|
| **Dashboard** | 7 stat cards, monthly budget bar, quick-add chips, recent transactions |
| **Calendar** | Month grid heatmap — green for income-only days, orange/red scaled to that month's highest spending day, gray for no activity. Click any day for its full list |
| **Transactions** | Date-range and type filters, full list with edit/duplicate/delete, JSON/CSV export, JSON import |
| **Analytics** | 6 Chart.js charts: category pie, method pie, income vs. expense doughnut, 6-month bar, daily trend line, top categories horizontal bar |
| **Insights** | 8 auto-calculated figures (most expensive day, top category, burn rate, etc.) |
| **Budget & recurring** | Set a monthly budget with 80%/100% warnings; recurring templates (rent, EMI, etc.) that auto-post a transaction once per month on their day |
| **Loans** | Given/taken tracking with interest, due dates, paid/pending/overdue status |
| **Reports** | Pick any month for a full breakdown, printable via the browser's print dialog |
| **Settings** | Theme, currency symbol, export/import/backup/restore, clear-all |

## Keyboard shortcuts

- `Ctrl/Cmd + N` — new transaction
- `Ctrl/Cmd + S` — submit whichever form/modal is open
- `Esc` — close any open dialog
- `/` — jump to search (when not typing elsewhere)

## Customizing the palette

The single accent color and every neutral gray live as CSS custom properties at the top of `style.css` (`:root` for light mode, `[data-theme="dark"]` for dark). Change `--accent` to re-theme every button, active nav item, and chart accent in one place.

# Give Me The Recipe

Paste a recipe URL, get just the recipe — title, times, ingredients,
and directions on a printable, shareable index card.

## Install

```
npm i
npm run dev
```

## How it works

`POST /api/extract-recipe` fetches the page once (with browser-grade
TLS via got-scraping) and extracts the recipe in two layers: schema.org
JSON-LD when the site publishes it, otherwise a DOM engine that scores
every list-like structure on the page (heading proximity, attribute
tokens, content shape) and merges the winning sections in document
order.

## Features

- Share a recipe as text plus a `/?recipe=` deep link that reopens the same card
- Print fits one page down to 12pt, then flows to two pages
- Recent lookups live in a localStorage tray behind the header's history button

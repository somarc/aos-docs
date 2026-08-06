# AOS Documentation

Greenfield Edge Delivery Services documentation site for DA CLI and the staged path to AOS — Agent Operating System.

## Environments

- Preview: `https://main--aos-docs--somarc.aem.page/`
- Live: `https://main--aos-docs--somarc.aem.live/`

## Source model

DA is the sole source of truth for authored content. This repository contains only the EDS code bus: the Docket-derived documentation shell, reusable blocks, styles, and runtime scripts.

Use the local DA CLI for every content, preview, audit, and publication operation.

## Search

Site search reads `/query-index.json` and is available from the homepage hero,
the global header, and the `Command/Ctrl + K` shortcut. The index definition is
owned by AEM Configuration Service, not a Git fixture. Inspect and validate it
through DA CLI:

```sh
da --org somarc --repo aos-docs index show --format json
da --org somarc --repo aos-docs index validate --target live --format json
```

The index contains page title, description, headings, and bounded main content;
fragments, media, drafts, and the 404 page are excluded. Rebuild it after an
approved content publication with `da --commit index build`.

# Jahia Statuspage.io

A Jahia module that embeds the [Jahia status page](https://status.jahia.com) widget inside the Jahia administration interface. It injects the Statuspage.io iframe into the UI so that administrators can see the current Jahia platform status without leaving the back office.

## How it works

On initialization, the module registers a callback with the Jahia UI Extender registry (target `jahiaApp-init:60`). That callback creates a fixed-position iframe pointing to `https://0tm5g9qc7sgj.statuspage.io/embed/frame` and appends it to the document body. The iframe communicates with the host page via `postMessage` to show or dismiss itself depending on the current Jahia status.

## Requirements

- Jahia 8.2.2.1 or later
- Jahia modules: `default`

## Building

The build requires Maven and uses the `frontend-maven-plugin` to download Node.js (v22.6.0) and Yarn (v1.22.21) automatically.

**Production build (used by Maven):**
```bash
mvn clean install
```

**Development build (watch mode):**
```bash
mvn clean install -Pdev
```

**Frontend only:**
```bash
yarn build             # development build
yarn build:production  # production build
yarn watch             # watch mode
```

**Bundle analysis:**
```bash
yarn build:analyze
yarn build:production-analyze
```

## Project structure

```
src/
  javascript/
    index.js                              # App shell bootstrap entry point
    init.js                               # Registers the Statuspage.io callback with the Jahia registry
    StatuspageIoBanner/
      StatuspageIoBanner.js               # Iframe injection logic adapted from status.jahia.com/embed/script.js
  main/
    resources/
      javascript/apps/                    # Webpack build output
      javascript/locales/en.json          # i18n strings
      META-INF/definitions.cnd            # Jahia content node definitions
      resources/jahia-statuspage-io.properties
```

## License

MIT — see [LICENSE.txt](LICENSE.txt)

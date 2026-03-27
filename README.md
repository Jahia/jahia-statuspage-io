# Jahia Statuspage.io

A Jahia module that embeds the [Jahia status page](https://status.jahia.com) widget in two ways:

- **Back office** — injected automatically into the Jahia administration interface via the UI Extender registry
- **Website** — available as a draggable `jnt:statuspageIoWidget` component that editors can drop onto any page in jContent

The Statuspage.io page ID is configurable at runtime through an OSGi configuration, a GraphQL API, and a dedicated administration panel.

## How it works

On initialization, the module fetches the current page ID via GraphQL and registers a callback with the Jahia UI Extender registry (target `jahiaApp-init:60`). That callback creates a fixed-position iframe pointing to `https://<pageId>.statuspage.io/embed/frame` and appends it to the document body. The iframe communicates with the host page via `postMessage` to show or dismiss itself depending on the current status.

The same logic is available as a website component through the `jnt:statuspageIoWidget` nodetype and its JSP view, which reads the `pageId` property set on the node and injects the iframe directly into the rendered page.

## Requirements

- Jahia 8.2.2.1 or later
- Jahia modules: `graphql-dxm-provider`

## Configuration

The Statuspage.io page ID is stored in the OSGi configuration PID `org.jahia.community.statuspageio`.

**Default configuration file** (`META-INF/configurations/org.jahia.community.statuspageio.cfg`):
```properties
pageId=
```

To override it at runtime, edit or create the file on the Jahia server:
```
<karaf-home>/etc/org.jahia.community.statuspageio.cfg
```

The change takes effect immediately without redeploying the module.

The page ID can also be updated through the GraphQL mutation (see [GraphQL API](#graphql-api)) or through the [Administration panel](#administration-panel).

## GraphQL API

The module extends the Jahia GraphQL API with a query and a mutation.

**Query — retrieve the current configuration:**
```graphql
query {
  statuspageIo {
    pageId
  }
}
```

**Mutation — update the page ID (requires `admin` permission):**
```graphql
mutation {
  updateStatuspageIoConfig(pageId: "newPageId")
}
```

## Administration panel

A configuration panel is available in the Jahia administration under **Configuration → Statuspage.io Configuration**. It allows administrators to view and update the page ID through a form backed by the GraphQL mutation above.

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
    index.js                                    # App shell bootstrap entry point
    init.js                                     # Registers the banner callback and the admin route
    StatuspageIoBanner/
      StatuspageIoBanner.js                     # Iframe injection logic (adapted from status.jahia.com/embed/script.js)
    StatuspageIoConfig/
      StatuspageIoConfigPanel.jsx               # Admin configuration form
      StatuspageIoConfigPanel.scss              # Panel styles (Moonstone CSS variables)
      StatuspageIoConfigPanel.gql.js            # GraphQL query and mutation used by the panel
  main/
    java/org/jahia/community/statuspageio/
      StatuspageIoConfig.java                   # OSGi Metatype configuration annotation
      StatuspageIoConfigService.java            # Service interface (getConfig, updatePageId)
      StatuspageIoConfigServiceImpl.java        # OSGi component — reads/writes config via ConfigAdmin
      graphql/
        GqlStatuspageIoConfig.java              # GraphQL output type
        StatuspageIoQueryExtension.java         # Extends DXGraphQLProvider.Query with statuspageIo field
        StatuspageIoMutationExtension.java      # Extends DXGraphQLProvider.Mutation with updateStatuspageIoConfig field
        StatuspageIoGraphQLExtensionProvider.java  # Registers query and mutation extensions
    resources/
      javascript/apps/                          # Webpack build output
      javascript/locales/en.json               # i18n strings
      META-INF/
        definitions.cnd                         # jnt:statuspageIoWidget nodetype definition
        configurations/
          org.jahia.community.statuspageio.cfg  # Default OSGi configuration
      jnt_statuspageIoWidget/
        html/statuspageIoWidget.jsp             # JSP view — injects the iframe into a website page
      resources/jahia-statuspage-io.properties  # Component and property labels
```

## License

MIT — see [LICENSE.txt](LICENSE.txt)

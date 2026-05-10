# jahia-statuspage-io

Jahia OSGi module that integrates Statuspage.io: injects a status banner on the public website and provides an admin panel to configure the Statuspage.io page ID. Admin UI at `/jahia/administration/jahia-statuspage-io-config`.

## Key Facts

- **artifactId**: `jahia-statuspage-io` | **version**: `1.0.1-SNAPSHOT`
- **Java package**: `org.jahia.community.statuspageio`
- **jahia-depends**: `default,graphql-dxm-provider`
- **OSGi config PID**: `org.jahia.community.statuspageio`
- Config uses `@Designate` / `@Component(configurationPid = ...)` pattern

## Architecture

| Class | Role |
|-------|------|
| `StatuspageIoConfig` | `@OCD` interface: declares `pageId()` |
| `StatuspageIoConfigService` | Service interface |
| `StatuspageIoConfigServiceImpl` | `@Activate`/`@Modified` lifecycle; reads config, exposes `getConfig()` and `updatePageId(String)` |
| `StatuspageIoQueryExtension` | GraphQL query (no auth required) |
| `StatuspageIoMutationExtension` | GraphQL mutation (admin) |
| `GqlStatuspageIoConfig` | Return type containing `pageId` and other fields |

`updatePageId` persists via `ConfigurationAdmin.getConfiguration("org.jahia.community.statuspageio")` — not JCR storage.

## GraphQL API

| Operation | Name | Notes |
|-----------|------|-------|
| Query | `statuspageIo` → `GqlStatuspageIoConfig{pageId, ...}` | **No permission required** — used by the banner on public pages |
| Mutation | `updateStatuspageIoConfig(pageId!)` → Boolean | Requires `admin` permission |

## Frontend Registrations

Two registrations in `init.js`:

1. **Banner callback** — `targets: ['jahiaApp-init:60']`: fetches `pageId` at app boot and calls `statuspageIoBanner(pageId)` to inject the status badge/widget
2. **Admin route** — `targets: ['administration-server-configuration:100']`: config form at `/jahia/administration/jahia-statuspage-io-config`

CSS prefix: `statuspageio_`.

## OSGi Configuration

File: `org.jahia.community.statuspageio.cfg`

| Property | Type |
|---|---|
| `pageId` | String |

`@Modified` detects changes via a config hash; re-runs `activate()` if the hash changed.

## Build

```bash
mvn clean install
yarn build
yarn lint
```

## Tests (Cypress Docker)

```bash
cd tests
cp .env.example .env
yarn install
./ci.build.sh && ./ci.startup.sh
```

- Tests: `tests/cypress/e2e/01-jahiaStatuspageIo.cy.ts`
- Tests cover: GraphQL query/mutation, admin UI (save pageId, cancel, validation)
- Banner injection test visits a public page and asserts the `<script>` tag is present

## Gotchas

- The `statuspageIo` query has **no permission guard** — this is intentional since the banner on public pages needs the `pageId` without authentication
- The `@Modified` callback in `StatuspageIoConfigServiceImpl` only re-runs `activate()` if the config hash changes — idempotent, avoids unnecessary restarts
- If `StatuspageIoConfigService` is not yet registered when the banner callback fires (during Jahia startup), `pageId` will be empty and the banner will not render
- CSS Modules: match in Cypress with `[class*="statuspageio_..."]`

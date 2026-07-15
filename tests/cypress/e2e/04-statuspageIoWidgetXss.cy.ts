import { DocumentNode } from 'graphql'
import { enableModule, editSite } from '@jahia/cypress'

/**
 * SEC-1 (SUPPORT-646, headline security regression guard) — WRITE + RENDER defense in depth.
 *
 * The per-node widget `pageId` is guarded on TWO independent layers:
 *
 *   1. WRITE PATH (added Stage 7): the CND (META-INF/definitions.cnd) constrains
 *      `jnt:statuspageIoWidget/pageId` to the value constraint `[a-z0-9-]{1,63}`, so JCR REJECTS
 *      any unsafe value at setValue/save time with a ConstraintViolationException. The
 *      addStatuspageIoWidget mutation therefore returns a GraphQL error and no node is persisted.
 *
 *   2. RENDER PATH (pre-existing): the JSP allowlist in
 *      jnt_statuspageIoWidget/html/statuspageIoWidget.jsp independently rejects pageIds of length
 *      0 or > 63 and any pageId containing a character outside [a-z0-9-], before it emits the
 *      inline `<script>` that interpolates `var pageId = '${pageId}';` (unescaped EL) + the iframe.
 *
 * Before Stage 7 the render allowlist was the SOLE guard (write path accepted any string). This
 * spec now fences BOTH layers: for each genuinely unsafe pageId it asserts (a) the mutation is
 * REJECTED at write time (constraint-violation error), and (b) nothing renders anyway (no iframe,
 * no test hook, no alert, raw payload absent from the DOM). A valid pageId is the positive control
 * — it persists AND renders. The spec fails loudly if either layer regresses.
 *
 * D7 residual (documented, not fixed here): the GLOBAL OSGi-config path uses a stricter DNS regex
 * and the JS util is looser (allows uppercase); a single shared constant across CND/Java/JSP/JS is
 * not achievable and is left as a maintainer follow-up (see definitions.cnd comment).
 */

const WEBSITE_PATH = '/sites/digitall/home.html'
const COMPONENT_PARENT = '/sites/digitall/home/footer-1'

// Each entry is a distinct stored-XSS / host-swap / malformed attempt that MUST be refused by
// the render-path allowlist. `marker` is a distinctive substring that must never reach the DOM.
// `name` is a UNIQUE node name per case so each attempt renders its OWN freshly-created node
// (never a stale sibling from a previous case).
const UNSAFE_PAGE_IDS: Array<{ label: string; name: string; pageId: string; marker: string }> = [
    {
        label: 'single-quote string-literal breakout',
        name: 'xss-quote',
        pageId: "x';window.__xss=1;//",
        marker: 'window.__xss',
    },
    {
        label: 'script-tag breakout',
        name: 'xss-scripttag',
        pageId: 'a</script><script>window.__xss=1</script>',
        marker: '__xss',
    },
    { label: 'host swap via dot', name: 'xss-dot', pageId: 'evil.com', marker: 'evil.com' },
    { label: 'host swap via @', name: 'xss-at', pageId: 'x@evil.com', marker: '@evil.com' },
    { label: 'host swap via double slash', name: 'xss-slash', pageId: 'x//evil.com', marker: '//evil.com' },
    { label: 'uppercase (outside a-z allowlist)', name: 'xss-upper', pageId: 'EvilPage', marker: 'EvilPage' },
    { label: 'over 63 characters', name: 'xss-toolong', pageId: 'a'.repeat(64), marker: 'a'.repeat(64) },
]

const VALID_PAGE_ID = 'w05wsjm4g1q6'
const VALID_NAME = 'xss-valid-control'

describe('Statuspage.io Widget — pageId injection defense (SEC-1)', () => {
    const siteKey = 'digitall'

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const addStatuspageIoWidget: DocumentNode = require('graphql-tag/loader!../fixtures/graphql/mutation/addStatuspageIoWidget.graphql')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const deleteNode: DocumentNode = require('graphql-tag/loader!../fixtures/graphql/mutation/deleteNode.graphql')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const publishNode: DocumentNode = require('graphql-tag/loader!../fixtures/graphql/mutation/publishNode.graphql')

    // cy.apollo does not fail the test on a GraphQL error; it exposes it on the result. This reads
    // the errors from either shape the client returns.
    const errorsOf = (result: {graphQLErrors?: Array<{message: string}>; errors?: Array<{message: string}>}) =>
        result.graphQLErrors ?? result.errors ?? []

    // Remove a widget node and propagate the deletion to live. Uses cy.apollo (authenticated
    // session), NOT cy.request+basic-auth: the API security filter denies basic-auth JCR
    // mutations, which would silently leave the node in place. Best-effort — a graphql error
    // (e.g. node already absent) is caught by cy.apollo and does not fail the test.
    const removeWidget = (name: string) => {
        cy.apollo({ mutation: deleteNode, variables: { path: `${COMPONENT_PARENT}/${name}` } })
        cy.apollo({ mutation: publishNode, variables: { path: COMPONENT_PARENT } })
    }

    // Create a widget with the given pageId and make it live: addChild publishes the child
    // inline, and publishing the parent flushes the footer-1 area-fragment output cache so the
    // freshly-created child is actually rendered on the live page (not served stale from cache).
    const createWidget = (name: string, pageId: string) => {
        cy.apollo({
            mutation: addStatuspageIoWidget,
            variables: { parentPath: COMPONENT_PARENT, name, pageId },
        })
        cy.apollo({ mutation: publishNode, variables: { path: COMPONENT_PARENT } })
    }

    const allNames = [...UNSAFE_PAGE_IDS.map((u) => u.name), VALID_NAME]

    before(() => {
        cy.login()
        enableModule('jahia-statuspage-io', siteKey)
        editSite(siteKey, { serverName: 'jahia' })
        // Clear any nodes left over from a previous run.
        allNames.forEach((name) => removeWidget(name))
    })

    after(() => {
        cy.login()
        allNames.forEach((name) => removeWidget(name))
    })

    UNSAFE_PAGE_IDS.forEach(({ label, name, pageId, marker }) => {
        it(`refuses an unsafe pageId: ${label}`, () => {
            cy.login()

            // LAYER 1 — WRITE PATH: the CND value constraint on jnt:statuspageIoWidget/pageId makes
            // JCR reject the setValue at save time, so the mutation returns a constraint-violation
            // error and the node is not persisted.
            cy.apollo({
                mutation: addStatuspageIoWidget,
                variables: { parentPath: COMPONENT_PARENT, name, pageId },
            }).then((result) => {
                expect(
                    errorsOf(result as never),
                    `write must be rejected at save time for: ${label}`,
                ).to.have.length.greaterThan(0)
            })
            cy.apollo({ mutation: publishNode, variables: { path: COMPONENT_PARENT } })

            // LAYER 2 — RENDER PATH: even if a bad pageId ever reached the JSP, the allowlist must
            // suppress the entire <script>/iframe block. Belt and suspenders.
            // Fail loudly if any injected script actually executes an alert.
            const onAlert = cy.stub().as('alert')
            cy.on('window:alert', onAlert)

            cy.visit(WEBSITE_PATH)

            // The JSP allowlist must have suppressed the entire <script>/iframe block:
            cy.get('body').should('exist')
            cy.get('iframe[title="Jahia Status"]').should('not.exist')
            // The test hook is only defined inside the safe block, so it must be absent.
            cy.window().its('statusEmbedTest').should('be.undefined')
            // The raw payload must never have been emitted into the served markup.
            cy.document().then((doc) => {
                expect(doc.documentElement.innerHTML).not.to.include(marker)
            })
            // No injected alert fired.
            cy.get('@alert').should('not.have.been.called')

            // Clean up this case's node so the next attempt starts from a known-empty area.
            removeWidget(name)
        })
    })

    it('DOES render the iframe for a valid pageId (positive control)', () => {
        cy.login()
        createWidget(VALID_NAME, VALID_PAGE_ID)

        cy.visit(WEBSITE_PATH)

        cy.get('iframe[title="Jahia Status"]', { timeout: 20000 })
            .should('exist')
            .and('have.attr', 'src', `https://${VALID_PAGE_ID}.statuspage.io/embed/frame`)

        removeWidget(VALID_NAME)
    })
})

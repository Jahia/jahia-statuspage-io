import {DocumentNode} from 'graphql';
import {enableModule, editSite} from '@jahia/cypress';

/**
 * SEC-1 (SUPPORT-646, headline security regression guard).
 *
 * The per-node widget `pageId` has NO server-side write validation: the CND declares it
 * `mandatory` with no value constraint, and no JCR listener validates it on save (verified in
 * Stage 2). The addStatuspageIoWidget mutation therefore persists ANY string an editor supplies.
 * The ONLY thing preventing stored XSS is the JSP render-path allowlist in
 * jnt_statuspageIoWidget/html/statuspageIoWidget.jsp, which:
 *   1. rejects pageIds of length 0 or > 63, and
 *   2. rejects any pageId containing a character outside [a-z0-9-],
 * and only then emits the inline `<script>` block that interpolates `var pageId = '${pageId}';`
 * (unescaped EL) and appends the iframe. If that allowlist ever loosened, a malicious editor
 * could break out of the `var pageId='...'` string literal or the iframe host and achieve
 * stored XSS on every public page carrying the widget.
 *
 * This spec is that single guard's regression fence: it persists genuinely unsafe pageIds and
 * proves nothing renders (no iframe, no test hook, no alert, raw payload absent from the DOM),
 * contrasted with a valid pageId that DOES render. It would fail loudly if the allowlist broke.
 *
 * NOTE for Stage 7: the correct hardening is to add write-side validation (a CND value
 * constraint, a save-time JCR listener, and/or JSP output escaping) so the defense is not
 * render-only — ideally via a single shared pageId regex constant reused by the OSGi-config path,
 * the JSP, and the JS validators (resolving the D7 three-divergent-validators finding). This test
 * characterizes the current render-only defense; it does not replace that hardening.
 */

const WEBSITE_PATH = '/sites/digitall/home.html';
const COMPONENT_PARENT = '/sites/digitall/home/footer-1';

// Each entry is a distinct stored-XSS / host-swap / malformed attempt that MUST be refused by
// the render-path allowlist. `marker` is a distinctive substring that must never reach the DOM.
// `name` is a UNIQUE node name per case so each attempt renders its OWN freshly-created node
// (never a stale sibling from a previous case).
const UNSAFE_PAGE_IDS: Array<{label: string; name: string; pageId: string; marker: string}> = [
    {label: 'single-quote string-literal breakout', name: 'xss-quote', pageId: "x';window.__xss=1;//", marker: 'window.__xss'},
    {label: 'script-tag breakout', name: 'xss-scripttag', pageId: 'a</script><script>window.__xss=1</script>', marker: '__xss'},
    {label: 'host swap via dot', name: 'xss-dot', pageId: 'evil.com', marker: 'evil.com'},
    {label: 'host swap via @', name: 'xss-at', pageId: 'x@evil.com', marker: '@evil.com'},
    {label: 'host swap via double slash', name: 'xss-slash', pageId: 'x//evil.com', marker: '//evil.com'},
    {label: 'uppercase (outside a-z allowlist)', name: 'xss-upper', pageId: 'EvilPage', marker: 'EvilPage'},
    {label: 'over 63 characters', name: 'xss-toolong', pageId: 'a'.repeat(64), marker: 'a'.repeat(64)}
];

const VALID_PAGE_ID = 'w05wsjm4g1q6';
const VALID_NAME = 'xss-valid-control';

describe('Statuspage.io Widget — pageId injection defense (SEC-1)', () => {
    const siteKey = 'digitall';

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const addStatuspageIoWidget: DocumentNode = require('graphql-tag/loader!../fixtures/graphql/mutation/addStatuspageIoWidget.graphql');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const deleteNode: DocumentNode = require('graphql-tag/loader!../fixtures/graphql/mutation/deleteNode.graphql');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const publishNode: DocumentNode = require('graphql-tag/loader!../fixtures/graphql/mutation/publishNode.graphql');

    // Remove a widget node and propagate the deletion to live. Uses cy.apollo (authenticated
    // session), NOT cy.request+basic-auth: the API security filter denies basic-auth JCR
    // mutations, which would silently leave the node in place. Best-effort — a graphql error
    // (e.g. node already absent) is caught by cy.apollo and does not fail the test.
    const removeWidget = (name: string) => {
        cy.apollo({mutation: deleteNode, variables: {path: `${COMPONENT_PARENT}/${name}`}});
        cy.apollo({mutation: publishNode, variables: {path: COMPONENT_PARENT}});
    };

    // Create a widget with the given pageId and make it live: addChild publishes the child
    // inline, and publishing the parent flushes the footer-1 area-fragment output cache so the
    // freshly-created child is actually rendered on the live page (not served stale from cache).
    const createWidget = (name: string, pageId: string) => {
        cy.apollo({
            mutation: addStatuspageIoWidget,
            variables: {parentPath: COMPONENT_PARENT, name, pageId}
        });
        cy.apollo({mutation: publishNode, variables: {path: COMPONENT_PARENT}});
    };

    const allNames = [...UNSAFE_PAGE_IDS.map(u => u.name), VALID_NAME];

    before(() => {
        cy.login();
        enableModule('jahia-statuspage-io', siteKey);
        editSite(siteKey, {serverName: 'jahia'});
        // Clear any nodes left over from a previous run.
        allNames.forEach(name => removeWidget(name));
    });

    after(() => {
        cy.login();
        allNames.forEach(name => removeWidget(name));
    });

    UNSAFE_PAGE_IDS.forEach(({label, name, pageId, marker}) => {
        it(`refuses to render an unsafe pageId: ${label}`, () => {
            cy.login();
            // The mutation persists the unsafe pageId unchanged (no server-side write validation).
            createWidget(name, pageId);

            // Fail loudly if any injected script actually executes an alert.
            const onAlert = cy.stub().as('alert');
            cy.on('window:alert', onAlert);

            cy.visit(WEBSITE_PATH);

            // The JSP allowlist must have suppressed the entire <script>/iframe block:
            cy.get('body').should('exist');
            cy.get('iframe[title="Jahia Status"]').should('not.exist');
            // The test hook is only defined inside the safe block, so it must be absent.
            cy.window().its('statusEmbedTest').should('be.undefined');
            // The raw payload must never have been emitted into the served markup.
            cy.document().then(doc => {
                expect(doc.documentElement.innerHTML).not.to.include(marker);
            });
            // No injected alert fired.
            cy.get('@alert').should('not.have.been.called');

            // Clean up this case's node so the next attempt starts from a known-empty area.
            removeWidget(name);
        });
    });

    it('DOES render the iframe for a valid pageId (positive control)', () => {
        cy.login();
        createWidget(VALID_NAME, VALID_PAGE_ID);

        cy.visit(WEBSITE_PATH);

        cy.get('iframe[title="Jahia Status"]', {timeout: 20000})
            .should('exist')
            .and('have.attr', 'src', `https://${VALID_PAGE_ID}.statuspage.io/embed/frame`);

        removeWidget(VALID_NAME);
    });
});

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
const COMPONENT_NAME = 'statuspage-widget-xss';
const COMPONENT_PATH = `${COMPONENT_PARENT}/${COMPONENT_NAME}`;

// Each entry is a distinct stored-XSS / host-swap / malformed attempt that MUST be refused by
// the render-path allowlist. `marker` is a distinctive substring that must never reach the DOM.
const UNSAFE_PAGE_IDS: Array<{label: string; pageId: string; marker: string}> = [
    {label: 'single-quote string-literal breakout', pageId: "x';window.__xss=1;//", marker: 'window.__xss'},
    {label: 'script-tag breakout', pageId: 'a</script><script>window.__xss=1</script>', marker: '__xss'},
    {label: 'host swap via dot', pageId: 'evil.com', marker: 'evil.com'},
    {label: 'host swap via @', pageId: 'x@evil.com', marker: '@evil.com'},
    {label: 'host swap via double slash', pageId: 'x//evil.com', marker: '//evil.com'},
    {label: 'uppercase (outside a-z allowlist)', pageId: 'EvilPage', marker: 'EvilPage'},
    {label: 'over 63 characters', pageId: 'a'.repeat(64), marker: 'a'.repeat(64)}
];

const VALID_PAGE_ID = 'w05wsjm4g1q6';

describe('Statuspage.io Widget — pageId injection defense (SEC-1)', () => {
    const siteKey = 'digitall';

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const addStatuspageIoWidget: DocumentNode = require('graphql-tag/loader!../fixtures/graphql/mutation/addStatuspageIoWidget.graphql');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const publishNode: DocumentNode = require('graphql-tag/loader!../fixtures/graphql/mutation/publishNode.graphql');

    const removeWidget = () => {
        // Best-effort removal + propagate to live so each case starts clean.
        cy.request({
            method: 'POST',
            url: '/modules/graphql',
            body: {query: `mutation { jcr(workspace: EDIT) { mutateNode(pathOrId: "${COMPONENT_PATH}") { delete } } }`},
            auth: {user: 'root', pass: Cypress.env('SUPER_USER_PASSWORD')},
            failOnStatusCode: false,
            log: false
        });
        cy.apollo({mutation: publishNode, variables: {path: COMPONENT_PARENT}});
    };

    before(() => {
        cy.login();
        enableModule('jahia-statuspage-io', siteKey);
        editSite(siteKey, {serverName: 'jahia'});
        removeWidget();
    });

    afterEach(() => {
        cy.login();
        removeWidget();
    });

    UNSAFE_PAGE_IDS.forEach(({label, pageId, marker}) => {
        it(`refuses to render an unsafe pageId: ${label}`, () => {
            cy.login();
            // The mutation persists the unsafe pageId unchanged (no server-side write validation).
            cy.apollo({
                mutation: addStatuspageIoWidget,
                variables: {parentPath: COMPONENT_PARENT, name: COMPONENT_NAME, pageId}
            });

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
        });
    });

    it('DOES render the iframe for a valid pageId (positive control)', () => {
        cy.login();
        cy.apollo({
            mutation: addStatuspageIoWidget,
            variables: {parentPath: COMPONENT_PARENT, name: COMPONENT_NAME, pageId: VALID_PAGE_ID}
        });

        cy.visit(WEBSITE_PATH);

        cy.get('iframe[title="Jahia Status"]')
            .should('exist')
            .and('have.attr', 'src', `https://${VALID_PAGE_ID}.statuspage.io/embed/frame`);
    });
});

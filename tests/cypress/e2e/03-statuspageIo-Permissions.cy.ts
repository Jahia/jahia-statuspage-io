import {DocumentNode} from 'graphql';
import {createUser, deleteUser, grantRoles} from '@jahia/cypress';

/**
 * Regression tests for the fine-grained `statuspageAdmin` permission.
 *
 * These guard against the gate being silently removed or mismatched across the stack:
 *  - Backend: `@GraphQLRequiresPermission("statuspageAdmin")` gates the
 *    `updateStatuspageIoConfig(pageId)` mutation (root-node ACL check).
 *  - Frontend: `requiredPermission: 'statuspageAdmin'` in init.js gates the admin route
 *    `jahia-statuspage-io-config` (`/jahia/administration/jahia-statuspage-io-config`).
 *  - RBAC content: the module ships the assignable `jahia-statuspage-io-administrator` role
 *    (src/main/import/roles.xml) granting `administrationAccess` + `statuspageAdmin`.
 *
 * The "allowed" user is granted that role and nothing else — never `admin` — so the tests prove
 * fine-grained granularity, not merely that a full administrator can pass.
 *
 * Note: the `statuspageIo` QUERY is intentionally PUBLIC (used by the banner on public pages),
 * so the gated operation under test is the `updateStatuspageIoConfig` MUTATION.
 */
describe('Statuspage.io — permission enforcement', () => {
    const ROLE_NAME = 'jahia-statuspage-io-administrator';
    const DENIED_USER = 'statuspageDeniedUser';
    const ALLOWED_USER = 'statuspageAllowedUser';
    const PASSWORD = 'StatusPerm9Pwd';
    const ADMIN_PATH = '/jahia/administration/jahia-statuspage-io-config';
    // Valid DNS-subdomain-label pageId: matches ^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$
    const VALID_PAGE_ID = 'teststatuspage';

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const updateStatuspageIoConfig: DocumentNode = require('graphql-tag/loader!../fixtures/graphql/mutation/updateStatuspageIoConfig.graphql');

    const errorsOf = (result: {graphQLErrors?: Array<{message: string}>; errors?: Array<{message: string}>}) =>
        result.graphQLErrors ?? result.errors ?? [];

    const updateConfigAs = (username: string, pageId: string) => {
        cy.apolloClient({username, password: PASSWORD});
        return cy.apollo({mutation: updateStatuspageIoConfig, variables: {pageId}});
    };

    before(() => {
        cy.login();
        createUser(DENIED_USER, PASSWORD);
        createUser(ALLOWED_USER, PASSWORD);
        // The annotation resolves the permission on the JCR root node, so grant the
        // module-shipped single-permission role on `/`.
        grantRoles('/', [ROLE_NAME], ALLOWED_USER, 'USER');
    });

    after(() => {
        cy.apolloClient(); // reset the current Apollo client back to root
        cy.login();
        // Clear the config back to a clean state.
        cy.apollo({mutation: updateStatuspageIoConfig, variables: {pageId: ''}});
        deleteUser(DENIED_USER);
        deleteUser(ALLOWED_USER);
    });

    describe('GraphQL API authorization', () => {
        it('denies the gated mutation for a user without the permission', () => {
            updateConfigAs(DENIED_USER, VALID_PAGE_ID).then((result: never) => {
                const errs = errorsOf(result);
                expect(errs, 'denial errors').to.have.length.greaterThan(0);
                expect(errs.map((e: {message: string}) => e.message).join(' ')).to.contain('Permission denied');
            });
        });

        it('allows the gated mutation for a user granted only the module permission', () => {
            updateConfigAs(ALLOWED_USER, VALID_PAGE_ID).then((result: never) => {
                expect(errorsOf(result), 'should have no errors').to.have.length(0);
                expect((result as {data: {statuspageIo: {updateConfig: boolean}}}).data.statuspageIo.updateConfig).to.eq(true);
            });
        });
    });

    describe('Admin UI authorization', () => {
        it('hides the admin panel from a user without the permission', () => {
            cy.login(DENIED_USER, PASSWORD);
            cy.visit(ADMIN_PATH, {failOnStatusCode: false});
            cy.get('#statuspageio-pageId').should('not.exist');
        });

        it('shows the admin panel to a user granted only the module permission', () => {
            cy.login(ALLOWED_USER, PASSWORD);
            cy.visit(ADMIN_PATH);
            cy.get('#statuspageio-pageId').should('be.visible');
        });
    });
});

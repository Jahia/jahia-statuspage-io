import {DocumentNode} from 'graphql';

describe('Statuspage.io Configuration', () => {
    const adminPath = '/jahia/administration/jahia-statuspage-io-config';
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const getStatuspageIoConfig: DocumentNode = require('graphql-tag/loader!../fixtures/graphql/query/getStatuspageIoConfig.graphql');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const updateStatuspageIoConfig: DocumentNode = require('graphql-tag/loader!../fixtures/graphql/mutation/updateStatuspageIoConfig.graphql');

    before(() => {
        cy.login();
        // Reset pageId to empty before the suite to guarantee a clean state
        cy.apollo({
            mutation: updateStatuspageIoConfig,
            variables: {pageId: ''}
        });
    });

    it('check admin panel renders with Page ID field and action buttons', () => {
        cy.login();
        cy.visit(adminPath);

        cy.get('#statuspageio-pageId').should('be.visible');

        // Action buttons
        cy.contains('button', 'Save').should('be.visible');
        cy.contains('button', 'Cancel').should('be.visible');
    });

    it('saves a pageId and shows a success alert', () => {
        cy.login();
        cy.visit(adminPath);

        cy.get('[id="statuspageio-pageId-input"]').clear();
        cy.get('[id="statuspageio-pageId-input"]').type('my-page-id');
        cy.contains('button', 'Save').click();

        cy.contains('Configuration saved successfully.').should('be.visible');

        // Verify persistence via GraphQL
        cy.apollo({query: getStatuspageIoConfig})
            .its('data.statuspageIo.pageId')
            .should('equal', 'my-page-id');
    });

    it('cancels edits and reverts the form to the last saved value', () => {
        cy.login();
        // Pre-load a known value via API
        cy.apollo({
            mutation: updateStatuspageIoConfig,
            variables: {pageId: 'original-page-id'}
        });

        cy.visit(adminPath);
        cy.get('#statuspageio-pageId-input').should('have.value', 'original-page-id');

        // Modify without saving
        cy.get('#statuspageio-pageId-input').clear();
        cy.get('#statuspageio-pageId-input').type('changed-page-id');
        cy.get('#statuspageio-pageId-input').should('have.value', 'changed-page-id');

        cy.contains('button', 'Cancel').click();

        // Value should revert to the last saved one
        cy.get('#statuspageio-pageId-input').should('have.value', 'original-page-id');
    });

    it('sets and retrieves pageId via the GraphQL API', () => {
        cy.login();
        cy.apollo({
            mutation: updateStatuspageIoConfig,
            variables: {pageId: 'api-page-id'}
        }).then((result: {data: {updateStatuspageIoConfig: boolean}}) => {
            expect(result.data.updateStatuspageIoConfig).to.be.true;
        });

        cy.apollo({query: getStatuspageIoConfig})
            .its('data.statuspageIo.pageId')
            .should('equal', 'api-page-id');
    });

    it('clears the pageId by saving an empty value', () => {
        cy.login();
        // Pre-load a value via API
        cy.apollo({
            mutation: updateStatuspageIoConfig,
            variables: {pageId: 'to-be-cleared'}
        });

        cy.visit(adminPath);
        cy.get('#statuspageio-pageId-input').should('have.value', 'to-be-cleared');

        cy.get('#statuspageio-pageId-input').clear();
        cy.contains('button', 'Save').click();
        cy.contains('Configuration saved successfully.').should('be.visible');

        cy.apollo({query: getStatuspageIoConfig})
            .its('data.statuspageIo.pageId')
            .should('be.empty');
    });

    it('reloads saved value when navigating back to the settings page', () => {
        cy.login();
        // Save via API
        cy.apollo({
            mutation: updateStatuspageIoConfig,
            variables: {pageId: 'persist-page-id'}
        });

        // First visit
        cy.visit(adminPath);
        cy.get('#statuspageio-pageId-input').should('have.value', 'persist-page-id');

        // Navigate away and come back
        cy.visit('/jahia/administration');
        cy.visit(adminPath);

        cy.get('#statuspageio-pageId-input').should('have.value', 'persist-page-id');
    });

    it('displays the statuspage.io banner for page ID w05wsjm4g1q6', () => {
        cy.login();
        // Configure the page ID via API
        cy.apollo({
            mutation: updateStatuspageIoConfig,
            variables: {pageId: 'w05wsjm4g1q6'}
        });

        // Visit the admin UI — the module initialises and injects the iframe
        cy.visit('/jahia/administration');

        // The iframe must be present with the correct statuspage.io source
        cy.get('iframe[title="Jahia Status"]')
            .should('exist')
            .and('have.attr', 'src', 'https://w05wsjm4g1q6.statuspage.io/embed/frame');

        // Simulate the postMessage that statuspage.io sends to reveal the banner
        cy.window().then(win => {
            win.postMessage({action: 'showFrame'}, '*');
        });

        // After showFrame the iframe should slide on-screen (right moves from -9999px to 60px)
        cy.get('iframe[title="Jahia Status"]').should(iframe => {
            expect(iframe[0].style.right).to.equal('60px');
        });
    });
});

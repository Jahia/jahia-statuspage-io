import {DocumentNode} from 'graphql';
import {enableModule, editSite} from '@jahia/cypress';

// Digitall home page where the widget will be visible
const WEBSITE_PATH = '/sites/digitall/home.html';

// JCR location for the widget component
const COMPONENT_PARENT = '/sites/digitall/home/footer-1';
const COMPONENT_NAME = 'statuspage-widget';
const COMPONENT_PATH = `${COMPONENT_PARENT}/${COMPONENT_NAME}`;

// Page ID configured on the widget node
const PAGE_ID = 'w05wsjm4g1q6';

describe('Statuspage.io Widget on Website', () => {
    const siteKey = 'digitall';

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const addStatuspageIoWidget: DocumentNode = require('graphql-tag/loader!../fixtures/graphql/mutation/addStatuspageIoWidget.graphql');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const deleteNode: DocumentNode = require('graphql-tag/loader!../fixtures/graphql/mutation/deleteNode.graphql');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const publishNode: DocumentNode = require('graphql-tag/loader!../fixtures/graphql/mutation/publishNode.graphql');

    before(() => {
        cy.login();

        // Activate the module on the digitall site
        enableModule('jahia-statuspage-io', siteKey);

        // Ensure the site server name is set so page URLs resolve correctly
        editSite(siteKey, {serverName: 'jahia'});

        // Best-effort cleanup: remove any widget node left over from a previous run
        cy.request({
            method: 'POST',
            url: '/modules/graphql',
            body: {
                query: `mutation { jcr(workspace: EDIT) { mutateNode(pathOrId: "${COMPONENT_PATH}") { delete } } }`
            },
            auth: {user: 'root', pass: Cypress.env('SUPER_USER_PASSWORD')},
            failOnStatusCode: false,
            log: false
        });

        // Add jnt:statuspageIoWidget under footer-1 with the configured pageId,
        // then publish it inline so the live page is updated immediately
        cy.apollo({
            mutation: addStatuspageIoWidget,
            variables: {
                parentPath: COMPONENT_PARENT,
                name: COMPONENT_NAME,
                pageId: PAGE_ID
            }
        });
    });

    after(() => {
        // Remove the widget node and propagate the deletion to the live workspace
        cy.apollo({mutation: deleteNode, variables: {path: COMPONENT_PATH}});
        cy.apollo({mutation: publishNode, variables: {path: COMPONENT_PARENT}});
    });

    it('injects the statuspage.io iframe into the digitall home page', () => {
        cy.visit(WEBSITE_PATH);

        // The JSP template creates an iframe for the configured pageId
        cy.get('iframe[title="Jahia Status"]')
            .should('exist')
            .and('have.attr', 'src', `https://${PAGE_ID}.statuspage.io/embed/frame`);
    });

    it('displays the banner popup when statuspage.io triggers showFrame', () => {
        cy.visit(WEBSITE_PATH);

        // Confirm the iframe is present but initially offscreen
        cy.get('iframe[title="Jahia Status"]').should('exist');

        // The JSP exposes window.statusEmbedTest = actions.showFrame as a test hook
        cy.window().invoke('statusEmbedTest');

        // After showFrame the iframe must slide on-screen (right: 60px)
        cy.get('iframe[title="Jahia Status"]').should(iframe => {
            expect(iframe[0].style.right).to.equal('60px');
        });
    });
});

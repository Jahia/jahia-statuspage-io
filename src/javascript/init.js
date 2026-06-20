import React from 'react';
import {print} from 'graphql';
import {registry} from '@jahia/ui-extender';
import {statuspageIoBanner} from './StatuspageIoBanner/StatuspageIoBanner';
import {StatuspageIoConfigPanel} from './StatuspageIoConfig/StatuspageIoConfigPanel';
import {GET_STATUSPAGE_CONFIG} from './StatuspageIoConfig/StatuspageIoConfigPanel.gql';

window.jahia.i18n.loadNamespaces('jahia-statuspage-io');

const STATUSPAGE_PAGE_ID = fetch('/modules/graphql', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({query: print(GET_STATUSPAGE_CONFIG)})
})
    .then(response => response.json())
    .then(data => data.data.statuspageIo.pageId)
    .catch(error => {
        console.error('jahia-statuspage-io: failed to fetch Statuspage.io page ID', error);
        return '';
    });

export default function () {
    registry.add('callback', 'jahia-statuspage-io', {
        targets: ['jahiaApp-init:60'],
        callback: () => STATUSPAGE_PAGE_ID.then(pageId => {
            if (pageId) {
                statuspageIoBanner(pageId);
            }
        })
    });

    registry.add('adminRoute', 'jahia-statuspage-io-config', {
        targets: ['administration-server-configuration:100'],
        icon: window.jahia.moonstone.toIconComponent('Settings'),
        requiredPermission: 'statuspageAdmin',
        label: 'jahia-statuspage-io:label.admin.config',
        isSelectable: true,
        render: () => React.createElement(StatuspageIoConfigPanel)
    });
}

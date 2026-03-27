import React from 'react';
import {registry} from '@jahia/ui-extender';
import {statuspageIoBanner} from './StatuspageIoBanner/StatuspageIoBanner';
import {StatuspageIoConfigPanel} from './StatuspageIoConfig/StatuspageIoConfigPanel';

window.jahia.i18n.loadNamespaces('jahia-statuspage-io');


const STATUSPAGE_PAGE_ID = fetch('/modules/graphql', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({query: '{ statuspageIo { pageId } }'})
})
    .then(response => response.json())
    .then(data => data.data.statuspageIo.pageId);

export default function () {
    console.debug('%c jahia-statuspage-io: activation in progress', 'color: #463CBA');

    registry.add('callback', 'jahia-statuspage-io', {
        targets: ['jahiaApp-init:60'],
        callback: () => STATUSPAGE_PAGE_ID.then(pageId => statuspageIoBanner(pageId))
    });

    registry.add('adminRoute', 'jahia-statuspage-io-config', {
        targets: ['administration-server-configuration:100'],
        icon: window.jahia.moonstone.toIconComponent('Settings'),
        requiredPermission: 'admin',
        label: 'jahia-statuspage-io:label.admin.config',
        isSelectable: true,
        render: () => React.createElement(StatuspageIoConfigPanel)
    });
}

console.debug('%c jahia-statuspage-io registered', 'color: #463CBA');

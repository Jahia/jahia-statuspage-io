import {registry} from '@jahia/ui-extender';
import {statuspageIoBanner} from './StatuspageIoBanner/StatuspageIoBanner';

window.jahia.i18n.loadNamespaces('jahia-statuspage-io');


const STATUSPAGE_PAGE_ID = fetch('/modules/graphql', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({query: '{ statuspageIo { pageId } }'})
})
    .then(response => response.json())
    .then(data => data.data.statuspageIo.pageId);

export default function () {
    registry.add('callback', 'feedbacks', {
        targets: ['jahiaApp-init:60'],
        callback: () => STATUSPAGE_PAGE_ID.then(pageId => statuspageIoBanner(pageId))
    });
}

console.debug('%c jahia-statuspage-io registered', 'color: #463CBA');

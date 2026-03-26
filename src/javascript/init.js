import {registry} from '@jahia/ui-extender';
import {statuspageIoBanner} from './StatuspageIoBanner/StatuspageIoBanner';

window.jahia.i18n.loadNamespaces('jahia-statuspage-io');

export default function () {
    registry.add('callback', 'feedbacks', {
        targets: ['jahiaApp-init:60'],
        callback: statuspageIoBanner
    });
}

console.debug('%c jahia-statuspage-io registered', 'color: #463CBA');

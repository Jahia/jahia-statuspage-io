import {buildOrigin, buildStatusUrl, isValidPageId, statusDescription} from './statuspageIoUtils';

const STATUS_REGION_ID = 'statuspageio-status-region';

function createStatusRegion() {
    let region = document.getElementById(STATUS_REGION_ID);
    if (region) {
        return region;
    }

    region = document.createElement('div');
    region.id = STATUS_REGION_ID;
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    // Visually hidden, but available to assistive technology.
    region.style.position = 'absolute';
    region.style.width = '1px';
    region.style.height = '1px';
    region.style.padding = '0';
    region.style.margin = '-1px';
    region.style.overflow = 'hidden';
    region.style.clip = 'rect(0, 0, 0, 0)';
    region.style.whiteSpace = 'nowrap';
    region.style.border = '0';
    document.body.appendChild(region);
    return region;
}

// Fetch the public status.json and announce the human-readable status in the live region.
function announceStatus(pageId) {
    const statusUrl = buildStatusUrl(pageId);
    if (!statusUrl || typeof fetch !== 'function') {
        return;
    }

    const region = createStatusRegion();
    fetch(statusUrl)
        .then(response => (response.ok ? response.json() : null))
        .then(payload => {
            const text = statusDescription(payload);
            if (text) {
                region.textContent = text;
            }
        })
        .catch(() => {
            // Leave the region empty on failure; never throw.
        });
}

function moveFocusToMain() {
    let target = document.querySelector('main');
    if (!target) {
        target = document.body;
    }

    if (target && typeof target.focus === 'function') {
        if (target.tabIndex < 0) {
            target.setAttribute('tabindex', '-1');
        }

        target.focus();
    }
}

export function statuspageIoBanner(pageId) {
    const origin = buildOrigin(pageId);
    if (!origin) {
        return;
    }

    announceStatus(pageId);

    const prefersMotion = typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: no-preference)').matches;

    const frame = document.createElement('iframe');
    frame.src = origin + '/embed/frame';
    frame.style.position = 'fixed';
    frame.style.border = 'none';
    frame.style.boxShadow = '0 20px 32px -8px rgba(9,20,66,0.25)';
    frame.style.zIndex = '9999';

    frame.title = 'Jahia Status';
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;

    const mobile = window.innerWidth < 450;
    if (mobile) {
        frame.src += '?mobile=true';
        frame.style.height = '20vh';
        frame.style.width = '100vw';
        frame.style.left = '-9999px';
        frame.style.bottom = '-9999px';
        frame.style.transition = prefersMotion ? 'bottom 1s ease' : 'none';
    } else {
        frame.style.height = '115px';
        frame.style.width = '320px';
        frame.style.left = 'auto';
        frame.style.right = '-9999px';
        frame.style.bottom = '60px';
        frame.style.transition = prefersMotion ? 'left 1s ease, bottom 1s ease, right 1s ease' : 'none';
    }

    document.body.appendChild(frame);

    const showFrame = function () {
        frame.style.display = 'block';
        frame.removeAttribute('aria-hidden');
        frame.tabIndex = 0;
        if (mobile) {
            frame.style.left = '0';
            frame.style.bottom = '0';
        } else {
            frame.style.left = 'auto';
            frame.style.right = '60px';
        }
    };

    const dismissFrame = function () {
        // Move focus to a real focusable target before hiding to prevent focus loss.
        if (document.activeElement === frame || frame.contains(document.activeElement)) {
            moveFocusToMain();
        }

        if (mobile) {
            frame.style.left = '-9999px';
        } else {
            frame.style.right = '-9999px';
        }

        frame.setAttribute('aria-hidden', 'true');
        frame.tabIndex = -1;
        // Fully remove from accessibility tree after transition completes.
        setTimeout(function () {
            frame.style.display = 'none';
        }, 1000);
    };

    const actions = {showFrame: showFrame, dismissFrame: dismissFrame};

    window.addEventListener('message', function (event) {
        // Validate origin before processing postMessage.
        if (event.origin !== origin) {
            return;
        }

        if (!event.data || typeof event.data !== 'object') {
            return;
        }

        const action = event.data.action;
        if (typeof action !== 'string' || !Object.prototype.hasOwnProperty.call(actions, action)) {
            return;
        }

        // Explicit dispatch over the known actions (no dynamic indexing).
        if (action === 'showFrame') {
            showFrame();
        } else if (action === 'dismissFrame') {
            dismissFrame();
        }
    }, false);
}

export {isValidPageId, buildStatusUrl, buildOrigin, statusDescription};

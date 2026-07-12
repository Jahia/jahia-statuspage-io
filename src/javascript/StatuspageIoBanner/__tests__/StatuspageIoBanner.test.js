import {statuspageIoBanner} from '../StatuspageIoBanner';

const VALID_PAGE_ID = 'valid-page';
const VALID_ORIGIN = 'https://valid-page.statuspage.io';

// Flush the microtask queue so fetch().then() chains settle before assertions.
function flushPromises() {
    return new Promise(resolve => setTimeout(resolve, 0));
}

function iframes() {
    return document.querySelectorAll('iframe[title="Jahia Status"]');
}

describe('statuspageIoBanner (DOM)', () => {
    let originalMatchMedia;
    let originalFetch;

    beforeEach(() => {
        document.body.innerHTML = '';
        originalMatchMedia = window.matchMedia;
        originalFetch = global.fetch;
        // The jsdom environment does not implement fetch; provide a benign default so announceStatus resolves.
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({status: {description: ''}})
        });
    });

    afterEach(() => {
        window.matchMedia = originalMatchMedia;
        global.fetch = originalFetch;
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    // -------------------------------------------------------------------------
    // G-Je1 / SEC-2b render + G-Je7 / F9 — render early-abort vs. valid injection
    // -------------------------------------------------------------------------
    describe('render guard', () => {
        test('appends no iframe for an injection payload (buildOrigin -> null)', () => {
            statuspageIoBanner('"><script>');

            expect(iframes()).toHaveLength(0);
        });

        test('appends no iframe for an empty pageId (F9 graceful degradation)', () => {
            statuspageIoBanner('');

            expect(iframes()).toHaveLength(0);
        });

        test('appends no iframe for a non-string pageId', () => {
            statuspageIoBanner(undefined);
            statuspageIoBanner(null);

            expect(iframes()).toHaveLength(0);
        });

        test('appends exactly one iframe with the embed src as a DOM property for a valid id', () => {
            statuspageIoBanner(VALID_PAGE_ID);

            const frames = iframes();
            expect(frames).toHaveLength(1);
            // The src is assigned via the DOM property, never string-concatenated markup.
            expect(frames[0].src).toBe(VALID_ORIGIN + '/embed/frame');
            expect(frames[0].getAttribute('aria-hidden')).toBe('true');
        });
    });

    // -------------------------------------------------------------------------
    // G-Je2 / U1 — announceStatus fetch behaviour
    // -------------------------------------------------------------------------
    describe('announceStatus fetch', () => {
        test('fetches the public status.json endpoint for the page id', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({status: {description: 'All Systems Operational'}})
            });

            statuspageIoBanner(VALID_PAGE_ID);
            await flushPromises();

            expect(global.fetch).toHaveBeenCalledWith(VALID_ORIGIN + '/api/v2/status.json');
            const region = document.getElementById('statuspageio-status-region');
            expect(region.textContent).toBe('All Systems Operational');
        });

        test('leaves the live region empty and never throws when the response is not ok', async () => {
            global.fetch = jest.fn().mockResolvedValue({ok: false, json: () => Promise.resolve({})});

            expect(() => statuspageIoBanner(VALID_PAGE_ID)).not.toThrow();
            await flushPromises();

            expect(document.getElementById('statuspageio-status-region').textContent).toBe('');
        });

        test('leaves the live region empty and never throws when the fetch rejects', async () => {
            global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

            expect(() => statuspageIoBanner(VALID_PAGE_ID)).not.toThrow();
            await flushPromises();

            expect(document.getElementById('statuspageio-status-region').textContent).toBe('');
        });
    });

    // -------------------------------------------------------------------------
    // G-Je3 / U2 — screen-reader live region
    // -------------------------------------------------------------------------
    describe('live region', () => {
        test('creates a visually-hidden polite status region', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({status: {description: 'Partial Outage'}})
            });

            statuspageIoBanner(VALID_PAGE_ID);
            await flushPromises();

            const region = document.getElementById('statuspageio-status-region');
            expect(region).not.toBeNull();
            expect(region.getAttribute('role')).toBe('status');
            expect(region.getAttribute('aria-live')).toBe('polite');
            // Visually hidden but available to assistive technology.
            expect(region.style.position).toBe('absolute');
            expect(region.style.width).toBe('1px');
            expect(region.style.overflow).toBe('hidden');
            // The jsdom runtime normalises the clip units to px; match on the zero-rect shape.
            expect(region.style.clip.replace(/px/g, '')).toBe('rect(0, 0, 0, 0)');
        });

        test('reuses the same region on a second banner call (no duplicate)', async () => {
            statuspageIoBanner(VALID_PAGE_ID);
            await flushPromises();
            statuspageIoBanner(VALID_PAGE_ID);
            await flushPromises();

            expect(document.querySelectorAll('#statuspageio-status-region')).toHaveLength(1);
        });
    });

    // -------------------------------------------------------------------------
    // G-Je4 / U3 — prefers-reduced-motion gating
    // -------------------------------------------------------------------------
    describe('prefers-reduced-motion', () => {
        test('applies the slide transition when motion is allowed', () => {
            window.matchMedia = jest.fn().mockReturnValue({matches: true});

            statuspageIoBanner(VALID_PAGE_ID);

            expect(iframes()[0].style.transition)
                .toBe('left 1s ease, bottom 1s ease, right 1s ease');
        });

        test('disables the transition when reduced motion is preferred', () => {
            window.matchMedia = jest.fn().mockReturnValue({matches: false});

            statuspageIoBanner(VALID_PAGE_ID);

            expect(iframes()[0].style.transition).toBe('none');
        });
    });

    // -------------------------------------------------------------------------
    // G-Je6 / U8 — hardened postMessage handling
    // -------------------------------------------------------------------------
    describe('postMessage handling', () => {
        function dispatch(origin, data) {
            window.dispatchEvent(new MessageEvent('message', {origin, data}));
        }

        test('ignores messages from a foreign origin', () => {
            statuspageIoBanner(VALID_PAGE_ID);
            const frame = iframes()[0];

            dispatch('https://evil.com', {action: 'showFrame'});

            expect(frame.style.right).toBe('-9999px');
        });

        test('ignores messages whose data is not an object', () => {
            statuspageIoBanner(VALID_PAGE_ID);
            const frame = iframes()[0];

            dispatch(VALID_ORIGIN, 'showFrame');

            expect(frame.style.right).toBe('-9999px');
        });

        test('ignores non-allowlisted actions (prototype pollution attempt)', () => {
            statuspageIoBanner(VALID_PAGE_ID);
            const frame = iframes()[0];

            dispatch(VALID_ORIGIN, {action: 'toString'});
            dispatch(VALID_ORIGIN, {action: '__proto__'});

            expect(frame.style.right).toBe('-9999px');
        });

        test('reveals the frame only for a valid showFrame from the matching origin', () => {
            statuspageIoBanner(VALID_PAGE_ID);
            const frame = iframes()[0];

            dispatch(VALID_ORIGIN, {action: 'showFrame'});

            expect(frame.style.right).toBe('60px');
            expect(frame.getAttribute('aria-hidden')).toBeNull();
        });
    });

    // -------------------------------------------------------------------------
    // G-Je5 / U4 — focus management on dismiss
    // -------------------------------------------------------------------------
    describe('focus management on dismiss', () => {
        test('moves focus to <main> and hides the frame after the transition', () => {
            jest.useFakeTimers();
            document.body.innerHTML = '<main></main>';

            statuspageIoBanner(VALID_PAGE_ID);
            const frame = iframes()[0];

            // Reveal, then place focus inside the frame so dismiss must relocate it.
            window.dispatchEvent(new MessageEvent('message', {
                origin: VALID_ORIGIN,
                data: {action: 'showFrame'}
            }));
            frame.focus();
            expect(document.activeElement).toBe(frame);

            window.dispatchEvent(new MessageEvent('message', {
                origin: VALID_ORIGIN,
                data: {action: 'dismissFrame'}
            }));

            const main = document.querySelector('main');
            expect(main.getAttribute('tabindex')).toBe('-1');
            expect(document.activeElement).toBe(main);
            expect(frame.getAttribute('aria-hidden')).toBe('true');
            expect(frame.tabIndex).toBe(-1);
            expect(frame.style.right).toBe('-9999px');

            // The display:none is deferred until the 1s slide-out transition completes.
            expect(frame.style.display).not.toBe('none');
            jest.advanceTimersByTime(1000);
            expect(frame.style.display).toBe('none');
        });
    });
});

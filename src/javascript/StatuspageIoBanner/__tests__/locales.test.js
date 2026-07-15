// G-Je8 / F10 + G-Je9 / U5 — i18n resource validity and locale parity.
// The panel consumes t('label.admin.<key>'); a missing key would render the raw key
// in the admin UI, and a French drift would silently fall back to English.

const en = require('../../../main/resources/javascript/locales/en.json');
const fr = require('../../../main/resources/javascript/locales/fr.json');

// Keys consumed by StatuspageIoConfigPanel.jsx (as label.admin.<key>).
const CONSUMED_KEYS = [
    'config',
    'intro',
    'pageId',
    'save',
    'saving',
    'saved',
    'saveError',
    'cancel',
    'cancelled',
    'loading',
    'error'
];

function flatten(obj, prefix = '') {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        const path = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === 'object') {
            Object.assign(acc, flatten(value, path));
        } else {
            acc[path] = value;
        }

        return acc;
    }, {});
}

describe('en.json (F10)', () => {
    test('is a valid object with a label.admin namespace', () => {
        expect(typeof en).toBe('object');
        expect(en.label).toBeDefined();
        expect(en.label.admin).toBeDefined();
    });

    test.each(CONSUMED_KEYS)('provides a non-empty label.admin.%s', key => {
        const value = en.label.admin[key];
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
    });
});

describe('fr.json (U5)', () => {
    test('is a valid object with a label.admin namespace', () => {
        expect(typeof fr).toBe('object');
        expect(fr.label.admin).toBeDefined();
    });

    test('has exact key parity with en.json (no missing or extra keys)', () => {
        const enKeys = Object.keys(flatten(en)).sort();
        const frKeys = Object.keys(flatten(fr)).sort();
        expect(frKeys).toEqual(enKeys);
    });

    test.each(CONSUMED_KEYS)('provides a non-empty label.admin.%s', key => {
        const value = fr.label.admin[key];
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
    });
});

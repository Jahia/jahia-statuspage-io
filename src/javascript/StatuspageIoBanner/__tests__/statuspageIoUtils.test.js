import {
    buildOrigin,
    buildStatusUrl,
    isValidPageId,
    statusDescription
} from '../statuspageIoUtils';

describe('isValidPageId', () => {
    test('accepts alphanumeric and hyphen ids', () => {
        expect(isValidPageId('w05wsjm4g1q6')).toBe(true);
        expect(isValidPageId('my-page-id')).toBe(true);
    });

    test('rejects empty, non-string, and unsafe ids', () => {
        expect(isValidPageId('')).toBe(false);
        expect(isValidPageId(undefined)).toBe(false);
        expect(isValidPageId(null)).toBe(false);
        expect(isValidPageId('bad.id')).toBe(false);
        expect(isValidPageId('a/b')).toBe(false);
        expect(isValidPageId('a b')).toBe(false);
        expect(isValidPageId('"><script>')).toBe(false);
    });
});

describe('buildStatusUrl', () => {
    test('builds the public status.json URL for a valid id', () => {
        expect(buildStatusUrl('w05wsjm4g1q6'))
            .toBe('https://w05wsjm4g1q6.statuspage.io/api/v2/status.json');
    });

    test('returns null for an invalid id', () => {
        expect(buildStatusUrl('')).toBeNull();
        expect(buildStatusUrl('bad.id')).toBeNull();
    });
});

describe('buildOrigin', () => {
    test('builds the embed origin for a valid id', () => {
        expect(buildOrigin('my-page')).toBe('https://my-page.statuspage.io');
    });

    test('returns null for an invalid id', () => {
        expect(buildOrigin('a b')).toBeNull();
    });
});

describe('statusDescription', () => {
    test('returns the description when present', () => {
        expect(statusDescription({status: {description: 'All Systems Operational', indicator: 'none'}}))
            .toBe('All Systems Operational');
    });

    test('falls back to the indicator when description is missing', () => {
        expect(statusDescription({status: {indicator: 'minor'}})).toBe('minor');
    });

    test('returns empty string for malformed payloads', () => {
        expect(statusDescription(null)).toBe('');
        expect(statusDescription({})).toBe('');
        expect(statusDescription({status: {}})).toBe('');
        expect(statusDescription('nope')).toBe('');
    });
});

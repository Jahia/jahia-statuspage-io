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

    // G-Je10 / D7 — pin the KNOWN-PERMISSIVE behaviour of the JS render util so any
    // future tightening is a conscious change. This util (/^[A-Za-z0-9-]+$/) is looser
    // than the Java write validator ^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$ and the JSP
    // allowlist: it accepts uppercase, leading/trailing hyphens, and has no length cap.
    // All three still reject injection metacharacters, but they are NOT equivalent.
    // Stage-7 hardening should converge them onto a single shared regex constant.
    describe('D7 divergence — permissive JS validator (regression pin)', () => {
        test('accepts uppercase (unlike the Java write validator and the JSP allowlist)', () => {
            expect(isValidPageId('ABC')).toBe(true);
        });

        test('accepts leading and trailing hyphens (unlike the Java write validator)', () => {
            expect(isValidPageId('-x-')).toBe(true);
        });

        test('has no length cap (unlike the 63-char Java/JSP limit)', () => {
            expect(isValidPageId('a'.repeat(200))).toBe(true);
        });
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

// Pure, testable helpers for the Statuspage.io banner.

const PAGE_ID_PATTERN = /^[A-Za-z0-9-]+$/;

/**
 * Validate a Statuspage.io page identifier.
 * @param {string} pageId
 * @returns {boolean} true when the id is a safe DNS-label-like value
 */
export function isValidPageId(pageId) {
    return typeof pageId === 'string' && PAGE_ID_PATTERN.test(pageId);
}

/**
 * Build the public status JSON endpoint for a page id.
 * @param {string} pageId
 * @returns {string|null} the status.json URL, or null when the id is invalid
 */
export function buildStatusUrl(pageId) {
    if (!isValidPageId(pageId)) {
        return null;
    }

    return 'https://' + pageId + '.statuspage.io/api/v2/status.json';
}

/**
 * Build the embed frame URL for a page id.
 * @param {string} pageId
 * @returns {string|null} the embed origin, or null when the id is invalid
 */
export function buildOrigin(pageId) {
    if (!isValidPageId(pageId)) {
        return null;
    }

    return 'https://' + pageId + '.statuspage.io';
}

/**
 * Extract a human-readable status description from a status.json payload.
 * @param {{status?: {description?: string, indicator?: string}}} payload
 * @returns {string} the description, the indicator, or an empty string
 */
export function statusDescription(payload) {
    if (!payload || typeof payload !== 'object' || !payload.status) {
        return '';
    }

    const {description, indicator} = payload.status;
    if (typeof description === 'string' && description.length > 0) {
        return description;
    }

    if (typeof indicator === 'string' && indicator.length > 0) {
        return indicator;
    }

    return '';
}

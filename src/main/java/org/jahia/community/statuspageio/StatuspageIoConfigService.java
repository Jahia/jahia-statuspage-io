package org.jahia.community.statuspageio;

/**
 * Service for reading and updating the Statuspage.io OSGi configuration.
 */
public interface StatuspageIoConfigService {

    /**
     * Returns the current OSGi configuration snapshot, or {@code null} if the component has not
     * yet been activated (e.g. during early Jahia startup).
     *
     * @return the active {@link StatuspageIoConfig}, or {@code null} when unavailable
     */
    StatuspageIoConfig getConfig();

    /**
     * Persists a new Statuspage.io page identifier via ConfigurationAdmin.
     *
     * <p>The {@code pageId} must either be an empty string (which clears the configuration) or a
     * DNS subdomain label matching {@code ^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$} (lowercase
     * alphanumerics and hyphens, 1–63 characters).
     *
     * @param pageId the new page identifier, or an empty string to clear the configuration;
     *               must not be {@code null}
     * @throws IllegalArgumentException   if {@code pageId} is {@code null} or fails the format check
     * @throws StatuspageIoConfigException if the ConfigurationAdmin update fails
     */
    void updatePageId(String pageId);
}

package org.jahia.community.statuspageio;

import org.apache.commons.lang3.StringUtils;
import org.osgi.service.cm.Configuration;
import org.osgi.service.cm.ConfigurationAdmin;
import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Component;
import org.osgi.service.component.annotations.Modified;
import org.osgi.service.component.annotations.Reference;
import org.osgi.service.metatype.annotations.Designate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.Dictionary;
import java.util.Hashtable;
import java.util.regex.Pattern;

@Component(service = StatuspageIoConfigService.class, configurationPid = "org.jahia.community.statuspageio", immediate = true)
@Designate(ocd = StatuspageIoConfig.class)
public class StatuspageIoConfigServiceImpl implements StatuspageIoConfigService {

    private static final Logger LOGGER = LoggerFactory.getLogger(StatuspageIoConfigServiceImpl.class);
    static final String CONFIG_PID = "org.jahia.community.statuspageio";
    static final String PAGE_ID_PROPERTY = "pageId";
    // Statuspage.io page identifiers are DNS subdomain labels: lowercase alphanumerics and hyphens, 1-63 chars.
    private static final Pattern PAGE_ID_PATTERN = Pattern.compile("^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$");

    /**
     * Immutable snapshot of the config and its hash, held in a single volatile reference so that
     * reads from GraphQL threads always see a consistent pair (CRIT-1).
     */
    static final class ConfigSnapshot {
        final StatuspageIoConfig config;
        final String hash;

        ConfigSnapshot(StatuspageIoConfig config, String hash) {
            this.config = config;
            this.hash = hash;
        }
    }

    // Volatile reference to an IMMUTABLE snapshot: written by the SCR thread (@Activate/@Modified),
    // read by GraphQL threads. Safe publication via volatile of an immutable object is correct, so
    // S3077 ("volatile is not enough") is a false positive here.
    @SuppressWarnings("java:S3077")
    private volatile ConfigSnapshot snapshot;

    @Reference
    private ConfigurationAdmin configurationAdmin;

    @Activate
    public void activate(StatuspageIoConfig config) {
        // HIGH-5: bundleContext and Bundle.ACTIVE check removed — the bundle is always active
        // when @Activate is called by the SCR container.
        if (config != null) {
            snapshot = new ConfigSnapshot(config, hash(config));
            if (StringUtils.isNotEmpty(config.pageId())) {
                LOGGER.info("Statuspage.io configuration is ready");
            } else {
                LOGGER.warn("Statuspage.io configuration is incomplete, please check your configuration");
            }
        } else {
            snapshot = null;
            LOGGER.error("Statuspage.io configuration is missing");
        }
    }

    /**
     * CRIT-2: @Modified updates the snapshot directly without re-invoking @Activate or
     * using a stored BundleContext.
     */
    @Modified
    protected void modified(StatuspageIoConfig config) {
        final String newHash = hash(config);
        final ConfigSnapshot current = snapshot;
        if (current == null || !newHash.equals(current.hash)) {
            LOGGER.info("Changes detected in provider config. Statuspage.io config would be recreated");
            snapshot = new ConfigSnapshot(config, newHash);
        }
    }

    @Override
    public StatuspageIoConfig getConfig() {
        final ConfigSnapshot s = snapshot;
        return s != null ? s.config : null;
    }

    @Override
    public void updatePageId(String pageId) {
        if (pageId == null) {
            throw new IllegalArgumentException("Invalid Statuspage.io pageId; must not be null");
        }
        if (!pageId.isEmpty() && !PAGE_ID_PATTERN.matcher(pageId).matches()) {
            throw new IllegalArgumentException(
                    "Invalid Statuspage.io pageId; expected DNS subdomain label (a-z, 0-9, hyphen, 1-63 chars)");
        }
        try {
            // HIGH-6: "?" makes the configuration location-independent so the bundle location
            // does not pin the configuration to a specific bundle.
            Configuration configuration = configurationAdmin.getConfiguration(CONFIG_PID, "?");
            Dictionary<String, Object> properties = configuration.getProperties();
            if (properties == null) {
                properties = new Hashtable<>();
            }
            properties.put(PAGE_ID_PROPERTY, pageId);
            configuration.update(properties);
        } catch (IOException e) {
            throw new StatuspageIoConfigException("Failed to update Statuspage.io configuration", e);
        }
    }

    private String hash(StatuspageIoConfig config) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            digest.update(StringUtils.defaultString(config.pageId()).getBytes(StandardCharsets.UTF_8));
            byte[] hashBytes = digest.digest();
            return Base64.getEncoder().encodeToString(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Unable to find SHA-256 algorithm", e);
        }
    }
}

package org.jahia.community.statuspageio;


import org.apache.commons.lang3.StringUtils;
import org.osgi.framework.Bundle;
import org.osgi.framework.BundleContext;
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

@Component(service = StatuspageIoConfigService.class, configurationPid = "org.jahia.community.statuspageio", immediate = true)
@Designate(ocd = StatuspageIoConfig.class)
public class StatuspageIoConfigServiceImpl implements StatuspageIoConfigService {
    public static final Logger LOGGER = LoggerFactory.getLogger(StatuspageIoConfigServiceImpl.class);
    private StatuspageIoConfig config;
    private BundleContext bundleContext;
    private String configHash;

    @Reference
    private ConfigurationAdmin configurationAdmin;

    @Activate
    @Modified
    public void activate(BundleContext bundleContext, StatuspageIoConfig config) {
        this.bundleContext = bundleContext;
        if (config != null) {
            this.config = config;
            this.configHash = hash(config);
            if (isConfigurationReady() && bundleContext.getBundle().getState() == Bundle.ACTIVE) {
                LOGGER.info("Statuspage.io configuration is ready");
            } else {
                LOGGER.warn("Statuspage.io configuration is incomplete, please check your configuration");
            }
        } else {
            LOGGER.error("Statuspage.io configuration is missing");
        }

    }

    @Modified
    protected void modified(StatuspageIoConfig config) throws Exception {
        if (!hash(config).equals(this.configHash)) {
            LOGGER.info("Changes detected in provider config. Statuspage.io config would be recreated");
            activate(bundleContext, config);
        }
    }

    @Override
    public StatuspageIoConfig getConfig() {
        return config;
    }

    @Override
    public void updatePageId(String pageId) throws IOException {
        Configuration configuration = configurationAdmin.getConfiguration("org.jahia.community.statuspageio", null);
        Dictionary<String, Object> properties = configuration.getProperties();
        if (properties == null) {
            properties = new Hashtable<>();
        }
        properties.put("pageId", pageId);
        configuration.update(properties);
    }

    private boolean isConfigurationReady() {
        return StringUtils.isNotEmpty(config.pageId());
    }

    private String hash(StatuspageIoConfig config) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            digest.update(config.pageId().getBytes(StandardCharsets.UTF_8));
            byte[] hashBytes = digest.digest();
            return Base64.getEncoder().encodeToString(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Unable to find SHA-256 algorithm", e);
        }
    }
}

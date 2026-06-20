package org.jahia.community.statuspageio;

/**
 * Unchecked exception thrown when a Statuspage.io configuration operation fails at the
 * OSGi ConfigurationAdmin layer (e.g. an {@link java.io.IOException} from
 * {@link org.osgi.service.cm.Configuration#update}).
 */
public class StatuspageIoConfigException extends RuntimeException {

    public StatuspageIoConfigException(String message, Throwable cause) {
        super(message, cause);
    }
}

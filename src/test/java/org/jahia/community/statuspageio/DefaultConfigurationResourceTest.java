package org.jahia.community.statuspageio;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * G-J1 — guards the shipped default OSGi configuration resource
 * (META-INF/configurations/org.jahia.community.statuspageio.cfg).
 *
 * <p>Two invariants are pinned:</p>
 * <ul>
 *   <li>The file MUST start with the exact marker line
 *       {@code # default configuration - won't be overridden}. Without it Jahia's module
 *       extender overwrites the deployed {@code karaf/etc} file on every start/deployment,
 *       silently discarding operator changes.</li>
 *   <li>It ships an <em>empty</em> {@code pageId} so a freshly deployed module renders no
 *       banner until an administrator configures a page id.</li>
 * </ul>
 */
@DisplayName("Default OSGi configuration resource")
class DefaultConfigurationResourceTest {

    private static final String CONFIG_RESOURCE =
            "/META-INF/configurations/org.jahia.community.statuspageio.cfg";
    private static final String REQUIRED_FIRST_LINE = "# default configuration - won't be overridden";

    private String readResource() throws Exception {
        try (InputStream in = DefaultConfigurationResourceTest.class.getResourceAsStream(CONFIG_RESOURCE)) {
            assertThat(in)
                    .as("default configuration resource must be present on the classpath at %s", CONFIG_RESOURCE)
                    .isNotNull();
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    @Test
    @DisplayName("starts with the do-not-override marker line so the extender keeps operator edits")
    void configuration_startsWithDoNotOverrideMarker() throws Exception {
        String content = readResource();

        String firstLine = content.split("\\R", 2)[0];

        assertThat(firstLine).isEqualTo(REQUIRED_FIRST_LINE);
    }

    @Test
    @DisplayName("ships an empty pageId so no banner renders until configured")
    void configuration_shipsEmptyPageId() throws Exception {
        Properties props = new Properties();
        try (InputStream in = DefaultConfigurationResourceTest.class.getResourceAsStream(CONFIG_RESOURCE)) {
            assertThat(in).isNotNull();
            props.load(in);
        }

        assertThat(props).containsKey("pageId");
        assertThat(props.getProperty("pageId")).isEmpty();
    }
}

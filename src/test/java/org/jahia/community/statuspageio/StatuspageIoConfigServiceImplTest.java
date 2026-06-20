package org.jahia.community.statuspageio;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.osgi.service.cm.Configuration;
import org.osgi.service.cm.ConfigurationAdmin;

import java.io.IOException;
import java.lang.reflect.Field;
import java.util.Dictionary;
import java.util.Hashtable;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@DisplayName("StatuspageIoConfigServiceImpl")
class StatuspageIoConfigServiceImplTest {

    private ConfigurationAdmin configurationAdmin;
    private Configuration configuration;
    private StatuspageIoConfigServiceImpl service;

    @BeforeEach
    void setUp() throws Exception {
        configurationAdmin = mock(ConfigurationAdmin.class);
        configuration = mock(Configuration.class);
        service = new StatuspageIoConfigServiceImpl();
        injectField(service, "configurationAdmin", configurationAdmin);
    }

    private static void injectField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    private static StatuspageIoConfig configWith(String pageId) {
        StatuspageIoConfig cfg = mock(StatuspageIoConfig.class);
        when(cfg.pageId()).thenReturn(pageId);
        return cfg;
    }

    // -------------------------------------------------------------------------
    // @Activate
    // -------------------------------------------------------------------------
    @Nested
    @DisplayName("activate")
    class ActivateTests {

        @Test
        @DisplayName("sets snapshot so getConfig returns the activated config")
        void activate_setsConfig() {
            StatuspageIoConfig cfg = configWith("my-page");

            service.activate(cfg);

            assertThat(service.getConfig()).isSameAs(cfg);
        }

        @Test
        @DisplayName("getConfig returns null before activate is called")
        void getConfig_beforeActivate_returnsNull() {
            assertThat(service.getConfig()).isNull();
        }

        @Test
        @DisplayName("activate with null config leaves getConfig returning null")
        void activate_nullConfig_getConfigReturnsNull() {
            service.activate(null);

            assertThat(service.getConfig()).isNull();
        }
    }

    // -------------------------------------------------------------------------
    // @Modified
    // -------------------------------------------------------------------------
    @Nested
    @DisplayName("modified")
    class ModifiedTests {

        @Test
        @DisplayName("replaces snapshot when pageId hash changes")
        void modified_hashChanged_updatesSnapshot() {
            StatuspageIoConfig original = configWith("old-page");
            service.activate(original);

            StatuspageIoConfig updated = configWith("new-page");
            service.modified(updated);

            assertThat(service.getConfig()).isSameAs(updated);
        }

        @Test
        @DisplayName("retains existing snapshot when config hash is unchanged")
        void modified_sameHash_keepsExistingSnapshot() {
            StatuspageIoConfig original = configWith("same-page");
            service.activate(original);

            // A different mock object but identical pageId → same hash.
            StatuspageIoConfig duplicate = configWith("same-page");
            service.modified(duplicate);

            // The snapshot should NOT have been swapped out.
            assertThat(service.getConfig()).isSameAs(original);
        }

        @Test
        @DisplayName("modified with no prior activate (null snapshot) installs new snapshot")
        void modified_noActivate_installsSnapshot() {
            StatuspageIoConfig cfg = configWith("first-page");

            service.modified(cfg);

            assertThat(service.getConfig()).isSameAs(cfg);
        }
    }

    // -------------------------------------------------------------------------
    // updatePageId — validation
    // -------------------------------------------------------------------------
    @Nested
    @DisplayName("updatePageId — validation")
    class ValidationTests {

        @Test
        @DisplayName("rejects null pageId")
        void updatePageId_null_throws() {
            assertThatThrownBy(() -> service.updatePageId(null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("must not be null");
        }

        @ParameterizedTest
        @ValueSource(strings = {
                "Has Space",
                "UPPER",
                "under_score",
                "-leadinghyphen",
                "trailinghyphen-",
                "javascript:alert(1)",
                "a/b",
                "https://evil.example.com"
        })
        @DisplayName("rejects values that are not DNS subdomain labels")
        void updatePageId_invalid_throws(String invalid) {
            assertThatThrownBy(() -> service.updatePageId(invalid))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("DNS subdomain label");
        }

        @Test
        @DisplayName("rejects labels longer than 63 characters")
        void updatePageId_tooLong_throws() {
            String tooLong = "a".repeat(64);
            assertThatThrownBy(() -> service.updatePageId(tooLong))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("does not touch ConfigurationAdmin when validation fails")
        void updatePageId_invalid_doesNotPersist() throws Exception {
            assertThatThrownBy(() -> service.updatePageId("Invalid Value"))
                    .isInstanceOf(IllegalArgumentException.class);

            verify(configurationAdmin, never())
                    .getConfiguration(StatuspageIoConfigServiceImpl.CONFIG_PID, "?");
        }
    }

    // -------------------------------------------------------------------------
    // updatePageId — persistence
    // -------------------------------------------------------------------------
    @Nested
    @DisplayName("updatePageId — persistence")
    class PersistenceTests {

        @ParameterizedTest
        @ValueSource(strings = {"abc123", "my-status-page", "a", "x9"})
        @DisplayName("persists valid pageId via ConfigurationAdmin")
        void updatePageId_valid_persists(String valid) throws Exception {
            when(configurationAdmin.getConfiguration(StatuspageIoConfigServiceImpl.CONFIG_PID, "?"))
                    .thenReturn(configuration);
            when(configuration.getProperties()).thenReturn(null);

            service.updatePageId(valid);

            @SuppressWarnings("unchecked")
            ArgumentCaptor<Dictionary<String, Object>> captor =
                    ArgumentCaptor.forClass(Dictionary.class);
            verify(configuration).update(captor.capture());
            assertThat(captor.getValue().get(StatuspageIoConfigServiceImpl.PAGE_ID_PROPERTY))
                    .isEqualTo(valid);
        }

        @Test
        @DisplayName("accepts empty string to clear configuration")
        void updatePageId_empty_clears() throws Exception {
            Dictionary<String, Object> existing = new Hashtable<>();
            existing.put(StatuspageIoConfigServiceImpl.PAGE_ID_PROPERTY, "old-value");
            when(configurationAdmin.getConfiguration(StatuspageIoConfigServiceImpl.CONFIG_PID, "?"))
                    .thenReturn(configuration);
            when(configuration.getProperties()).thenReturn(existing);

            service.updatePageId("");

            verify(configuration).update(existing);
            assertThat(existing.get(StatuspageIoConfigServiceImpl.PAGE_ID_PROPERTY)).isEqualTo("");
        }

        @Test
        @DisplayName("wraps ConfigurationAdmin IOException in StatuspageIoConfigException")
        void updatePageId_ioException_wrappedAsUnchecked() throws Exception {
            when(configurationAdmin.getConfiguration(StatuspageIoConfigServiceImpl.CONFIG_PID, "?"))
                    .thenThrow(new IOException("disk full"));

            assertThatThrownBy(() -> service.updatePageId("valid-page"))
                    .isInstanceOf(StatuspageIoConfigException.class)
                    .hasMessageContaining("Failed to update")
                    .hasCauseInstanceOf(IOException.class);
        }
    }
}

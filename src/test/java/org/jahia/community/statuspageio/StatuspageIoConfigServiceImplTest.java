package org.jahia.community.statuspageio;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
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
        injectConfigurationAdmin(service, configurationAdmin);
    }

    private static void injectConfigurationAdmin(StatuspageIoConfigServiceImpl target, ConfigurationAdmin admin) throws Exception {
        Field field = StatuspageIoConfigServiceImpl.class.getDeclaredField("configurationAdmin");
        field.setAccessible(true);
        field.set(target, admin);
    }

    @Test
    @DisplayName("updatePageId rejects null pageId")
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
    @DisplayName("updatePageId rejects values that are not DNS subdomain labels")
    void updatePageId_invalid_throws(String invalid) {
        assertThatThrownBy(() -> service.updatePageId(invalid))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("DNS subdomain label");
    }

    @Test
    @DisplayName("updatePageId rejects labels longer than 63 characters")
    void updatePageId_tooLong_throws() {
        String tooLong = "a".repeat(64);
        assertThatThrownBy(() -> service.updatePageId(tooLong))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @ParameterizedTest
    @ValueSource(strings = {"abc123", "my-status-page", "a", "x9"})
    @DisplayName("updatePageId persists valid pageId via ConfigurationAdmin")
    void updatePageId_valid_persists(String valid) throws IOException {
        when(configurationAdmin.getConfiguration(StatuspageIoConfigServiceImpl.CONFIG_PID, null))
                .thenReturn(configuration);
        when(configuration.getProperties()).thenReturn(null);

        service.updatePageId(valid);

        ArgumentCaptor<Dictionary<String, Object>> captor = ArgumentCaptor.forClass(Dictionary.class);
        verify(configuration).update(captor.capture());
        assertThat(captor.getValue().get(StatuspageIoConfigServiceImpl.PAGE_ID_PROPERTY)).isEqualTo(valid);
    }

    @Test
    @DisplayName("updatePageId accepts empty string to clear configuration")
    void updatePageId_empty_clears() throws IOException {
        Dictionary<String, Object> existing = new Hashtable<>();
        existing.put(StatuspageIoConfigServiceImpl.PAGE_ID_PROPERTY, "old-value");
        when(configurationAdmin.getConfiguration(StatuspageIoConfigServiceImpl.CONFIG_PID, null))
                .thenReturn(configuration);
        when(configuration.getProperties()).thenReturn(existing);

        service.updatePageId("");

        verify(configuration).update(existing);
        assertThat(existing.get(StatuspageIoConfigServiceImpl.PAGE_ID_PROPERTY)).isEqualTo("");
    }

    @Test
    @DisplayName("updatePageId does not touch ConfigurationAdmin when validation fails")
    void updatePageId_invalid_doesNotPersist() throws IOException {
        assertThatThrownBy(() -> service.updatePageId("Invalid Value"))
                .isInstanceOf(IllegalArgumentException.class);

        verify(configurationAdmin, never()).getConfiguration(StatuspageIoConfigServiceImpl.CONFIG_PID, null);
    }
}

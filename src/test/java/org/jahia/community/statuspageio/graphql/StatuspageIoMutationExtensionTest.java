package org.jahia.community.statuspageio.graphql;

import org.jahia.community.statuspageio.StatuspageIoConfigException;
import org.jahia.community.statuspageio.StatuspageIoConfigService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

@DisplayName("StatuspageIoMutationExtension")
class StatuspageIoMutationExtensionTest {

    private StatuspageIoConfigService configService;
    private StatuspageIoMutationExtension mutation;

    @BeforeEach
    void setUp() throws Exception {
        configService = mock(StatuspageIoConfigService.class);
        mutation = new StatuspageIoMutationExtension();
        injectField(mutation, "configService", configService);
    }

    private static void injectField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }

    @Test
    @DisplayName("delegates updatePageId to service and returns true")
    void updateStatuspageIoConfig_delegates_returnsTrue() {
        boolean result = mutation.updateStatuspageIoConfig("valid-page");

        verify(configService).updatePageId("valid-page");
        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("throws IllegalStateException when configService is null (service not yet registered)")
    void updateStatuspageIoConfig_nullService_throws() throws Exception {
        injectField(mutation, "configService", null);

        assertThatThrownBy(() -> mutation.updateStatuspageIoConfig("valid-page"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("StatuspageIoConfigService is not available");
    }

    @Test
    @DisplayName("propagates IllegalArgumentException from service when pageId is invalid")
    void updateStatuspageIoConfig_invalidPageId_propagatesException() {
        doThrow(new IllegalArgumentException("DNS subdomain label"))
                .when(configService).updatePageId("BAD_ID");

        assertThatThrownBy(() -> mutation.updateStatuspageIoConfig("BAD_ID"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("DNS subdomain label");
    }

    @Test
    @DisplayName("propagates StatuspageIoConfigException when ConfigurationAdmin fails")
    void updateStatuspageIoConfig_configAdminFailure_propagatesException() {
        doThrow(new StatuspageIoConfigException("Failed to update", new java.io.IOException("disk full")))
                .when(configService).updatePageId("valid-page");

        assertThatThrownBy(() -> mutation.updateStatuspageIoConfig("valid-page"))
                .isInstanceOf(StatuspageIoConfigException.class)
                .hasMessageContaining("Failed to update");
    }
}

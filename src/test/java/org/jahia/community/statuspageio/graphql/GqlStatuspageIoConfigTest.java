package org.jahia.community.statuspageio.graphql;

import org.jahia.community.statuspageio.StatuspageIoConfig;
import org.jahia.community.statuspageio.StatuspageIoConfigService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@DisplayName("GqlStatuspageIoConfig.getPageId")
class GqlStatuspageIoConfigTest {

    private static GqlStatuspageIoConfig withService(StatuspageIoConfigService service) throws Exception {
        GqlStatuspageIoConfig gql = new GqlStatuspageIoConfig();
        Field field = GqlStatuspageIoConfig.class.getDeclaredField("configService");
        field.setAccessible(true);
        field.set(gql, service);
        return gql;
    }

    @Test
    @DisplayName("returns empty string when config service is null")
    void getPageId_nullService_returnsEmpty() throws Exception {
        GqlStatuspageIoConfig gql = withService(null);

        assertThat(gql.getPageId()).isEmpty();
    }

    @Test
    @DisplayName("returns empty string when config is null")
    void getPageId_nullConfig_returnsEmpty() throws Exception {
        StatuspageIoConfigService service = mock(StatuspageIoConfigService.class);
        when(service.getConfig()).thenReturn(null);

        GqlStatuspageIoConfig gql = withService(service);

        assertThat(gql.getPageId()).isEmpty();
    }

    @Test
    @DisplayName("returns empty string when pageId is null")
    void getPageId_nullPageId_returnsEmpty() throws Exception {
        StatuspageIoConfig config = mock(StatuspageIoConfig.class);
        when(config.pageId()).thenReturn(null);
        StatuspageIoConfigService service = mock(StatuspageIoConfigService.class);
        when(service.getConfig()).thenReturn(config);

        GqlStatuspageIoConfig gql = withService(service);

        assertThat(gql.getPageId()).isEmpty();
    }

    @Test
    @DisplayName("returns configured pageId when present")
    void getPageId_present_returnsValue() throws Exception {
        StatuspageIoConfig config = mock(StatuspageIoConfig.class);
        when(config.pageId()).thenReturn("my-status-page");
        StatuspageIoConfigService service = mock(StatuspageIoConfigService.class);
        when(service.getConfig()).thenReturn(config);

        GqlStatuspageIoConfig gql = withService(service);

        assertThat(gql.getPageId()).isEqualTo("my-status-page");
    }

    @Test
    @DisplayName("getPageId returns non-null — GraphQL @GraphQLNonNull contract is upheld")
    void getPageId_alwaysNonNull() throws Exception {
        // Even with a null service the method must never return null.
        GqlStatuspageIoConfig gql = withService(null);

        assertThat(gql.getPageId()).isNotNull();
    }
}

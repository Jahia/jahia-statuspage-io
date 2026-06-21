package org.jahia.community.statuspageio.graphql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.annotations.annotationTypes.GraphQLNonNull;
import org.jahia.community.statuspageio.StatuspageIoConfigService;
import org.jahia.modules.graphql.provider.dxm.security.GraphQLRequiresPermission;
import org.jahia.osgi.BundleUtils;

@GraphQLName("StatuspageIoMutation")
@GraphQLDescription("Statuspage.io mutations")
public class StatuspageIoMutation {

    /**
     * Updates the Statuspage.io page id. Requires the {@code statuspageAdmin} permission.
     *
     * <p>The service is resolved via {@link BundleUtils#getOsgiService} rather than
     * {@code @GraphQLOsgiService} field injection: graphql-java-annotations invokes
     * {@code @GraphQLField} methods on a mutation type-extension statically, so field
     * injection does not apply here (unlike the {@code GqlStatuspageIoConfig} return type).
     *
     * @param pageId the Statuspage.io page id (validated by the service; empty clears it)
     * @return {@code true} on success
     * @throws IllegalStateException    if the config service is unavailable (module starting up)
     * @throws IllegalArgumentException if {@code pageId} fails validation
     */
    @GraphQLField
    @GraphQLName("updateConfig")
    @GraphQLNonNull
    @GraphQLDescription("Update the Statuspage.io module configuration")
    @GraphQLRequiresPermission("statuspageAdmin")
    public boolean updateStatuspageIoConfig(@GraphQLName("pageId") @GraphQLNonNull String pageId) {
        final StatuspageIoConfigService configService = BundleUtils.getOsgiService(StatuspageIoConfigService.class, null);
        if (configService == null) {
            throw new IllegalStateException(
                    "StatuspageIoConfigService is not available; the module may still be starting up");
        }
        // updatePageId throws IllegalArgumentException on invalid input and the unchecked
        // StatuspageIoConfigException on a ConfigurationAdmin failure.
        configService.updatePageId(pageId);
        return true;
    }
}

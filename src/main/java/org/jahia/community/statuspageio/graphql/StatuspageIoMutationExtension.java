package org.jahia.community.statuspageio.graphql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.annotations.annotationTypes.GraphQLNonNull;
import graphql.annotations.annotationTypes.GraphQLTypeExtension;
import org.jahia.community.statuspageio.StatuspageIoConfigService;
import org.jahia.modules.graphql.provider.dxm.DXGraphQLProvider;
import org.jahia.modules.graphql.provider.dxm.osgi.annotations.GraphQLOsgiService;
import org.jahia.modules.graphql.provider.dxm.security.GraphQLRequiresPermission;

import javax.inject.Inject;

@GraphQLTypeExtension(DXGraphQLProvider.Mutation.class)
@GraphQLDescription("Statuspage.io mutations")
// graphql-java-annotations requires field injection for @GraphQLOsgiService; constructor injection
// is not supported by the framework at this point.
@SuppressWarnings("java:S6813")
public class StatuspageIoMutationExtension {

    // HIGH-1: replaced BundleUtils.getOsgiService static lookup with the same
    // @Inject @GraphQLOsgiService field-injection pattern used in GqlStatuspageIoConfig.
    @Inject
    @GraphQLOsgiService
    private StatuspageIoConfigService configService;

    @GraphQLField
    @GraphQLName("updateStatuspageIoConfig")
    @GraphQLNonNull
    @GraphQLDescription("Update the Statuspage.io module configuration")
    @GraphQLRequiresPermission("statuspageAdmin")
    public boolean updateStatuspageIoConfig(@GraphQLName("pageId") @GraphQLNonNull String pageId) {
        if (configService == null) {
            throw new IllegalStateException(
                    "StatuspageIoConfigService is not available; the module may still be starting up");
        }
        // updatePageId throws IllegalArgumentException on invalid input and
        // StatuspageIoConfigException (unchecked) on ConfigurationAdmin failure.
        configService.updatePageId(pageId);
        return true;
    }
}

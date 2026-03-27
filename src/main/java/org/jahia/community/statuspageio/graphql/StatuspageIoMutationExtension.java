package org.jahia.community.statuspageio.graphql;

import graphql.annotations.annotationTypes.*;
import org.jahia.community.statuspageio.StatuspageIoConfigService;
import org.jahia.modules.graphql.provider.dxm.DXGraphQLProvider;
import org.jahia.modules.graphql.provider.dxm.security.GraphQLRequiresPermission;
import org.jahia.osgi.BundleUtils;

import java.io.IOException;

@GraphQLTypeExtension(DXGraphQLProvider.Mutation.class)
@GraphQLDescription("Statuspage.io mutations")
public class StatuspageIoMutationExtension {

    @GraphQLField
    @GraphQLName("updateStatuspageIoConfig")
    @GraphQLNonNull
    @GraphQLDescription("Update the Statuspage.io module configuration")
    @GraphQLRequiresPermission("admin")
    public static boolean updateStatuspageIoConfig(@GraphQLName("pageId") @GraphQLNonNull String pageId) throws IOException {
        final StatuspageIoConfigService configService = BundleUtils.getOsgiService(StatuspageIoConfigService.class, null);
        configService.updatePageId(pageId);
        return true;
    }
}

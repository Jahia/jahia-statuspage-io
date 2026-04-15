package org.jahia.community.statuspageio.graphql;

import graphql.annotations.annotationTypes.*;
import org.jahia.modules.graphql.provider.dxm.DXGraphQLProvider;

@GraphQLTypeExtension(DXGraphQLProvider.Query.class)
@GraphQLDescription("Statuspage.io queries")
public class StatuspageIoQueryExtension {

    private StatuspageIoQueryExtension() {
    }

    @GraphQLField
    @GraphQLName("statuspageIo")
    @GraphQLNonNull
    @GraphQLDescription("Retrieve the Statuspage.io module configuration")
    // No need to protect, no sensitive information
    public static GqlStatuspageIoConfig getStatuspageIo() {
        return new GqlStatuspageIoConfig();
    }
}

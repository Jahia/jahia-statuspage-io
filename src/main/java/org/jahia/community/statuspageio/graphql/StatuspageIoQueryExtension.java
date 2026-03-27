package org.jahia.community.statuspageio.graphql;

import graphql.annotations.annotationTypes.*;
import org.jahia.modules.graphql.provider.dxm.DXGraphQLProvider;

@GraphQLTypeExtension(DXGraphQLProvider.Query.class)
@GraphQLDescription("Statuspage.io queries")
public class StatuspageIoQueryExtension {

    public StatuspageIoQueryExtension(DXGraphQLProvider.Query query) {
    }

    @GraphQLField
    @GraphQLName("statuspageIo")
    @GraphQLNonNull
    @GraphQLDescription("Retrieve the Statuspage.io module configuration")
    public static GqlStatuspageIoConfig getStatuspageIo() {
        return new GqlStatuspageIoConfig();
    }
}

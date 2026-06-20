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
    @GraphQLDescription("Statuspage.io query namespace")
    public static StatuspageIoQuery statuspageIo() {
        return new StatuspageIoQuery();
    }
}

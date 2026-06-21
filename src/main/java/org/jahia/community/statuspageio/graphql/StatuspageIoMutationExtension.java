package org.jahia.community.statuspageio.graphql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.annotations.annotationTypes.GraphQLTypeExtension;
import org.jahia.modules.graphql.provider.dxm.DXGraphQLProvider;

@GraphQLTypeExtension(DXGraphQLProvider.Mutation.class)
@GraphQLDescription("Statuspage.io mutations")
public class StatuspageIoMutationExtension {

    private StatuspageIoMutationExtension() {
        // Static GraphQL type-extension; not instantiated.
    }

    @GraphQLField
    @GraphQLName("statuspageIo")
    @GraphQLDescription("Statuspage.io mutation namespace")
    public static StatuspageIoMutation statuspageIo() {
        return new StatuspageIoMutation();
    }
}

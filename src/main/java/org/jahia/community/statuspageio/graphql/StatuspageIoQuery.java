package org.jahia.community.statuspageio.graphql;

import graphql.annotations.annotationTypes.*;

@GraphQLName("StatuspageIoQuery")
@GraphQLDescription("Statuspage.io queries")
public class StatuspageIoQuery {

    @GraphQLField
    @GraphQLName("config")
    @GraphQLNonNull
    @GraphQLDescription("Retrieve the Statuspage.io module configuration")
    // No need to protect, no sensitive information
    public GqlStatuspageIoConfig getStatuspageIo() {
        return new GqlStatuspageIoConfig();
    }
}

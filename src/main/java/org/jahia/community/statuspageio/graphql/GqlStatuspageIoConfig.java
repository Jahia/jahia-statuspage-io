package org.jahia.community.statuspageio.graphql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.annotations.annotationTypes.GraphQLNonNull;
import org.jahia.community.statuspageio.StatuspageIoConfigService;
import org.jahia.modules.graphql.provider.dxm.osgi.annotations.GraphQLOsgiService;

import javax.inject.Inject;

@GraphQLDescription("Statuspage.io configuration")
@SuppressWarnings("java:S6813")
public class GqlStatuspageIoConfig {

    @Inject
    @GraphQLOsgiService
    private StatuspageIoConfigService configService;

    @GraphQLField
    @GraphQLName("pageId")
    @GraphQLNonNull
    @GraphQLDescription("Statuspage.io page identifier used to build the embed URL")
    public String getPageId() {
        return configService.getConfig().pageId();
    }

    public StatuspageIoConfigService getConfigService() {
        return configService;
    }
}

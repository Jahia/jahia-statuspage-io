package org.jahia.community.statuspageio;

import org.osgi.service.metatype.annotations.AttributeDefinition;
import org.osgi.service.metatype.annotations.ObjectClassDefinition;

@ObjectClassDefinition(name = "Jahia Statuspage.io", description = "Configuration for the Statuspage.io module")
public @interface StatuspageIoConfig {

    @AttributeDefinition(name = "Page ID", description = "Statuspage.io page identifier used to build the embed URL")
    String pageId();
}

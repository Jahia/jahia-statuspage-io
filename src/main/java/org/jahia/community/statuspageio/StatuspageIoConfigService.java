package org.jahia.community.statuspageio;

import java.io.IOException;

public interface StatuspageIoConfigService {

    StatuspageIoConfig getConfig();

    void updatePageId(String pageId) throws IOException;

}

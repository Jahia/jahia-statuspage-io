import gql from 'graphql-tag';

export const GET_STATUSPAGE_CONFIG = gql`
    query GetStatuspageIoConfig {
        statuspageIo {
            config {
                pageId
            }
        }
    }
`;

export const UPDATE_STATUSPAGE_CONFIG = gql`
    mutation UpdateStatuspageIoConfig($pageId: String!) {
        statuspageIo {
            updateConfig(pageId: $pageId)
        }
    }
`;

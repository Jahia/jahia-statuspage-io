import gql from 'graphql-tag';

export const GET_STATUSPAGE_CONFIG = gql`
    query GetStatuspageIoConfig {
        statuspageIo {
            pageId
        }
    }
`;

export const UPDATE_STATUSPAGE_CONFIG = gql`
    mutation UpdateStatuspageIoConfig($pageId: String!) {
        updateStatuspageIoConfig(pageId: $pageId)
    }
`;

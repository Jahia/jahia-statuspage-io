import React, {useEffect, useState} from 'react';
import {ApolloClient, ApolloProvider, InMemoryCache, useMutation, useQuery} from '@apollo/client';
import {Button, Input, Typography} from '@jahia/moonstone';
import {useTranslation} from 'react-i18next';
import {GET_STATUSPAGE_CONFIG, UPDATE_STATUSPAGE_CONFIG} from './StatuspageIoConfigPanel.gql';

const client = new ApolloClient({
    uri: `${window.contextJsParameters.contextPath}/modules/graphql`,
    cache: new InMemoryCache(),
    credentials: 'same-origin'
});

const ConfigForm = () => {
    const {t} = useTranslation('jahia-statuspage-io');
    const {data, loading, error} = useQuery(GET_STATUSPAGE_CONFIG);
    const [pageId, setPageId] = useState('');
    const [saved, setSaved] = useState(false);
    const [updateConfig, {loading: saving}] = useMutation(UPDATE_STATUSPAGE_CONFIG);

    useEffect(() => {
        if (data?.statuspageIo?.pageId) {
            setPageId(data.statuspageIo.pageId);
        }
    }, [data]);

    if (loading) {
        return <Typography>{t('label.admin.loading')}</Typography>;
    }

    if (error) {
        return <Typography>{t('label.admin.error')}</Typography>;
    }

    const handleSave = async () => {
        await updateConfig({variables: {pageId}});
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div style={{padding: '24px', maxWidth: '480px'}}>
            <Typography variant="heading" weight="bold" style={{marginBottom: '16px'}}>
                {t('label.admin.config')}
            </Typography>
            <Typography style={{marginBottom: '8px'}}>
                {t('label.admin.pageId')}
            </Typography>
            <Input
                value={pageId}
                onChange={e => setPageId(e.target.value)}
                style={{marginBottom: '16px', width: '100%'}}
            />
            <Button
                color="accent"
                onClick={handleSave}
                isDisabled={saving}
                style={{marginRight: '8px'}}
            >
                {t('label.admin.save')}
            </Button>
            {saved && (
                <Typography style={{display: 'inline', color: 'green'}}>
                    {t('label.admin.saved')}
                </Typography>
            )}
        </div>
    );
};

export const StatuspageIoConfigPanel = () => (
    <ApolloProvider client={client}>
        <ConfigForm/>
    </ApolloProvider>
);

import React, {useEffect, useState} from 'react';
import {ApolloClient, ApolloProvider, InMemoryCache, useMutation, useQuery} from '@apollo/client';
import {Button, Field, Input} from '@jahia/moonstone';
import {useTranslation} from 'react-i18next';
import {GET_STATUSPAGE_CONFIG, UPDATE_STATUSPAGE_CONFIG} from './StatuspageIoConfigPanel.gql';
import styles from './StatuspageIoConfigPanel.scss';

const client = new ApolloClient({
    uri: `${window.contextJsParameters.contextPath}/modules/graphql`,
    cache: new InMemoryCache(),
    credentials: 'same-origin'
});

const ConfigForm = () => {
    const {t} = useTranslation('jahia-statuspage-io');
    const {data, loading, error} = useQuery(GET_STATUSPAGE_CONFIG, {fetchPolicy: 'network-only'});
    const [pageId, setPageId] = useState('');
    const [saveStatus, setSaveStatus] = useState(null); // null | 'success' | 'error'
    const [updateConfig, {loading: saving}] = useMutation(UPDATE_STATUSPAGE_CONFIG);

    useEffect(() => {
        if (data?.statuspageIo?.pageId) {
            setPageId(data.statuspageIo.pageId);
        }
    }, [data]);

    if (loading) {
        return <div className={styles.statuspageio_loading}>{t('label.admin.loading')}</div>;
    }

    if (error) {
        return <div className={styles.statuspageio_error}>{t('label.admin.error')}: {error.message}</div>;
    }

    const handleSave = async () => {
        setSaveStatus(null);
        try {
            const result = await updateConfig({variables: {pageId}});
            setSaveStatus(result.data?.updateStatuspageIoConfig ? 'success' : 'error');
        } catch (err) {
            console.error('Failed to update Statuspage.io configuration:', err);
            setSaveStatus('error');
        }
    };

    const handleCancel = () => {
        setPageId(data?.statuspageIo?.pageId || '');
        setSaveStatus(null);
    };

    return (
        <div>
            <div className={styles.statuspageio_page_header}>
                <h2>{t('label.admin.config')}</h2>
            </div>
            <div className={styles.statuspageio_container}>
                <div className={styles.statuspageio_intro}>
                    <p>{t('label.admin.intro')}</p>
                </div>

                {saveStatus === 'success' && (
                    <div className={`${styles.statuspageio_alert} ${styles['statuspageio_alert--success']}`}>
                        {t('label.admin.saved')}
                    </div>
                )}
                {saveStatus === 'error' && (
                    <div className={`${styles.statuspageio_alert} ${styles['statuspageio_alert--error']}`}>
                        {t('label.admin.saveError')}
                    </div>
                )}

                <div className={styles.statuspageio_form}>
                    <Field label={t('label.admin.pageId')} id="statuspageio-pageId">
                        <Input
                            id="statuspageio-pageId"
                            value={pageId}
                            onChange={e => setPageId(e.target.value)}
                            placeholder="0tm5g9qc7sgj"
                        />
                    </Field>

                    <div className={styles.statuspageio_actions}>
                        <Button
                            label={saving ? t('label.admin.saving') : t('label.admin.save')}
                            variant="primary"
                            isDisabled={saving}
                            onClick={handleSave}
                        />
                        <Button
                            label={t('label.admin.cancel')}
                            variant="secondary"
                            isDisabled={saving}
                            onClick={handleCancel}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const StatuspageIoConfigPanel = () => (
    <ApolloProvider client={client}>
        <ConfigForm/>
    </ApolloProvider>
);

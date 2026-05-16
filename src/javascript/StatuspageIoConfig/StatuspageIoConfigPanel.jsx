import React, {useEffect, useRef, useState} from 'react';
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
    const [saveStatus, setSaveStatus] = useState(null); // null | 'success' | 'error' | 'cancelled'
    const [saveAttempt, setSaveAttempt] = useState(0);
    const [updateConfig, {loading: saving}] = useMutation(UPDATE_STATUSPAGE_CONFIG);

    const saveBtnRef = useRef(null);
    const pageIdRef = useRef(null);

    useEffect(() => {
        document.title = `${t('label.admin.config')} — Jahia Administration`;
    }, [t]);

    useEffect(() => {
        if (data?.statuspageIo?.pageId) {
            setPageId(data.statuspageIo.pageId);
        }
    }, [data]);

    if (loading) {
        return <div className={styles.statuspageio_loading} role="status">{t('label.admin.loading')}</div>;
    }

    if (error) {
        return <div className={styles.statuspageio_error} role="alert">{t('label.admin.error')}: {error.message}</div>;
    }

    const handleSave = async () => {
        const nextAttempt = saveAttempt + 1;
        setSaveAttempt(nextAttempt);
        try {
            const result = await updateConfig({variables: {pageId}});
            const status = result.data?.updateStatuspageIoConfig ? 'success' : 'error';
            setSaveStatus(status);
            setTimeout(() => {
                if (status === 'success') {
                    saveBtnRef.current?.focus();
                } else {
                    pageIdRef.current?.focus();
                }
            }, 50);
        } catch (err) {
            console.error('Failed to update Statuspage.io configuration:', err);
            setSaveStatus('error');
            setTimeout(() => pageIdRef.current?.focus(), 50);
        }
    };

    const handleCancel = () => {
        setPageId(data?.statuspageIo?.pageId || '');
        setSaveStatus('cancelled');
    };

    return (
        <div>
            {/* Separate always-in-DOM live regions with saveAttempt key to force re-announcement */}
            <div
                key={`status-${saveAttempt}`}
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className={styles.statuspageio_sr_only}
            >
                {saveStatus === 'success' ? t('label.admin.saved') : saveStatus === 'cancelled' ? t('label.admin.cancelled') : ''}
            </div>
            <div
                key={`alert-${saveAttempt}`}
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
                className={styles.statuspageio_sr_only}
            >
                {saveStatus === 'error' ? t('label.admin.saveError') : ''}
            </div>

            <div className={styles.statuspageio_page_header}>
                <h2>{t('label.admin.config')}</h2>
            </div>
            <div className={styles.statuspageio_container}>
                <div className={styles.statuspageio_intro}>
                    <p>{t('label.admin.intro')}</p>
                </div>

                {saveStatus === 'success' && (
                    <div aria-hidden="true" className={`${styles.statuspageio_alert} ${styles['statuspageio_alert--success']}`}>
                        {t('label.admin.saved')}
                    </div>
                )}
                {saveStatus === 'error' && (
                    <div aria-hidden="true" className={`${styles.statuspageio_alert} ${styles['statuspageio_alert--error']}`}>
                        {t('label.admin.saveError')}
                    </div>
                )}

                <div className={styles.statuspageio_form}>
                    <Field label={t('label.admin.pageId')} id="statuspageio-pageId">
                        <Input
                            inputRef={pageIdRef}
                            id="statuspageio-pageId-input"
                            value={pageId}
                            required
                            aria-required="true"
                            aria-invalid={saveStatus === 'error' ? 'true' : undefined}
                            aria-describedby={saveStatus === 'error' ? 'statuspageio-pageId-error' : undefined}
                            aria-label={t('label.admin.pageId')}
                            onChange={e => setPageId(e.target.value)}
                            placeholder=""
                        />
                    </Field>
                    {saveStatus === 'error' && (
                        <span id="statuspageio-pageId-error" className={styles.statuspageio_sr_only} role="alert">
                            {t('label.admin.saveError')}
                        </span>
                    )}

                    <div className={styles.statuspageio_actions}>
                        <Button
                            buttonRef={saveBtnRef}
                            type="button"
                            label={saving ? t('label.admin.saving') : t('label.admin.save')}
                            variant="primary"
                            isDisabled={saving}
                            onClick={handleSave}
                        />
                        <Button
                            type="button"
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

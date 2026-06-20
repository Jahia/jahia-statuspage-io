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
    const [saveStatus, setSaveStatus] = useState(null); // Null | 'success' | 'error' | 'cancelled'
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

    // Move focus once the save outcome is known, keyed on saveStatus (no setTimeout hack).
    useEffect(() => {
        if (saveStatus === 'success') {
            saveBtnRef.current?.focus();
        } else if (saveStatus === 'error') {
            pageIdRef.current?.focus();
        }
    }, [saveStatus]);

    if (loading) {
        return <div className={styles.statuspageio_loading} role="status">{t('label.admin.loading')}</div>;
    }

    if (error) {
        return <div className={styles.statuspageio_error} role="alert">{t('label.admin.error')}: {error.message}</div>;
    }

    const handleSave = async () => {
        try {
            const result = await updateConfig({variables: {pageId}});
            setSaveStatus(result.data?.updateStatuspageIoConfig ? 'success' : 'error');
        } catch {
            setSaveStatus('error');
        }
    };

    const handleCancel = () => {
        setPageId(data?.statuspageIo?.pageId || '');
        setSaveStatus('cancelled');
    };

    const politeMessage = saveStatus === 'success' ?
        t('label.admin.saved') :
        (saveStatus === 'cancelled' ? t('label.admin.cancelled') : '');
    const alertMessage = saveStatus === 'error' ? t('label.admin.saveError') : '';

    return (
        <div className={styles.statuspageio_root}>
            {/* Single persistent live regions, updated via state (never remounted). */}
            <output
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className={styles.statuspageio_sr_only}
            >
                {politeMessage}
            </output>
            <div
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
                className={styles.statuspageio_sr_only}
            >
                {alertMessage}
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
                            required
                            inputRef={pageIdRef}
                            id="statuspageio-pageId-input"
                            value={pageId}
                            aria-required="true"
                            aria-invalid={saveStatus === 'error' ? 'true' : undefined}
                            aria-describedby={saveStatus === 'error' ? 'statuspageio-pageId-error' : undefined}
                            aria-labelledby="statuspageio-pageId"
                            placeholder=""
                            onChange={e => setPageId(e.target.value)}
                        />
                    </Field>
                    {saveStatus === 'error' && (
                        <span id="statuspageio-pageId-error" className={styles.statuspageio_sr_only}>
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

/**
 * Admin panel for configuring the Statuspage.io page identifier.
 * Takes no props; wires the form to the module GraphQL endpoint via Apollo.
 * @returns {JSX.Element}
 */
export const StatuspageIoConfigPanel = () => (
    <ApolloProvider client={client}>
        <ConfigForm/>
    </ApolloProvider>
);

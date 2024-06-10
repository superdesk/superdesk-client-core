import React from 'react';
import {ContentDivider, Heading, IconButton, Spacer} from 'superdesk-ui-framework/react';
import {superdesk} from '../superdesk';
import TranslationsBody from './translations-body';
import TranslationFooter from './translations-footer';
import {ICommonProps, IStateTranslationsTab} from '../ai-assistant';
import {configuration} from '../configuration';

export default class TranslationsWidget extends React.Component<ICommonProps<IStateTranslationsTab>> {
    abortController: AbortController;

    constructor(props: ICommonProps<IStateTranslationsTab>) {
        super(props);

        this.abortController = new AbortController();

        this.generateTranslations = this.generateTranslations.bind(this);
    }

    generateTranslations() {
        configuration.translations?.generateTranslations?.(
            this.props.article,
            this.props.state.activeLanguageId,
            this.abortController.signal,
        )
            .then((res) => {
                this.props.setTabState({
                    ...this.props.state,
                    loading: false,
                    translation: res,
                });
            }).catch(() => {
                this.props.setTabState({
                    ...this.props.state,
                    loading: false,
                    error: true,
                    translation: '',
                });
            });
    }

    componentDidMount(): void {
        if (this.props.state.mode === 'other') {
            this.generateTranslations();
        }
    }

    componentWillUnmount(): void {
        this.abortController.abort();
    }

    render() {
        const {gettext} = superdesk.localization;
        const {
            article,
            children,
            state: {error, loading, translation, activeLanguageId, mode},
            setTabState,
            fieldsData,
            onFieldsDataChange,
        } = this.props;

        return children({
            header: (
                <>
                    <div className="p-1">
                        <Spacer
                            h
                            gap="64"
                            noGrow
                            justifyContent="start"
                            alignItems="center"
                        >
                            <IconButton
                                size="small"
                                icon="arrow-left"
                                onClick={() => {
                                    this.props.setSection(null);
                                }}
                                ariaValue={gettext('Close Translate')}
                            />
                            <Heading type="h4" align="center">
                                {gettext('Translate')}
                            </Heading>
                        </Spacer>
                    </div>
                    <ContentDivider type="solid" margin="none" />
                </>
            ),
            body: (
                <TranslationsBody
                    mode={mode}
                    activeLanguageId={activeLanguageId}
                    article={article}
                    error={error}
                    generateTranslation={() => {
                        setTabState({
                            ...this.props.state,
                            loading: true,
                            error: false,
                        }, () => this.generateTranslations());
                    }}
                    loading={loading}
                    translation={translation}
                    fieldsData={fieldsData}
                    onFieldsDataChange={onFieldsDataChange}
                />
            ),
            footer: (
                <TranslationFooter
                    mode={mode}
                    activeLanguageId={activeLanguageId}
                    setActiveLanguage={(language) => {
                        setTabState({
                            ...this.props.state,
                            activeLanguageId: language,
                        })
                    }}
                    generateTranslations={() => {
                        setTabState({
                            ...this.props.state,
                            loading: true,
                            error: false,
                        }, () => this.generateTranslations());
                    }}
                />
            ),
        })
    }
}

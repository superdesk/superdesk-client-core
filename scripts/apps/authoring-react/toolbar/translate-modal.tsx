import React from 'react';
import {sdApi} from 'api';
import {Spacer} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {IArticle, IExtensionActivationResult, IRestApiResponse, ITranslation} from 'superdesk-api';
import {Button, Modal, Option, Select} from 'superdesk-ui-framework/react';
import {notify} from 'core/notify/notify';
import {extensions} from 'appConfig';
import {flatMap} from 'lodash';
import ng from 'core/services/ng';

interface IProps {
    article: IArticle;
    closeModal(): void;
}

interface IStateLoading {
    initialized: false;
}

interface IStateLoaded {
    initialized: true;
    availableLanguages: Array<ITranslation> | null;
    selectedLanguage: string | null;
}

type IState = IStateLoaded | IStateLoading;

/**
 * Same two rules as the legacy dropdown (`apps/translations/directives/TranslationDropdown.ts`):
 * destinations only, and not the language the article is already in. Legacy renders that one disabled
 * rather than omitting it, which is not possible here because `Option` takes no `disabled` prop.
 */
export function getTranslationTargetLanguages(
    languages: Array<ITranslation>,
    currentLanguage: string,
): Array<ITranslation> {
    return languages.filter((language) => language.destination === true && language.language !== currentLanguage);
}

export class TranslateModal extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            initialized: false,
        };
    }

    componentDidMount(): void {
        this.fetchLanguages().then((result) => {
            this.setState({
                ...this.state,
                initialized: true,
                availableLanguages: result._items,
            });
        });
    }

    fetchLanguages() {
        return httpRequestJsonLocal<IRestApiResponse<ITranslation>>({
            method: 'GET',
            path: '/languages',
        });
    }

    translate() {
        if (this.state.initialized) {
            return httpRequestJsonLocal<IArticle>({
                method: 'POST',
                path: '/archive/translate',
                payload: {
                    desk: sdApi.desks.getCurrentDeskId(),
                    language: this.state.selectedLanguage,
                    guid: this.props.article._id,
                },
            }).then((item) => {
                const onTranslateAfterMiddlewares
                    : Array<IExtensionActivationResult['contributions']['entities']['article']['onTranslateAfter']>
                = flatMap(
                    Object.values(extensions).map(({activationResult}) => activationResult),
                    (activationResult) => activationResult?.contributions?.entities?.article?.onTranslateAfter ?? [],
                );

                if (onTranslateAfterMiddlewares.length > 0) {
                    onTranslateAfterMiddlewares.forEach((fn) => {
                        fn(this.props.article, item);
                    });
                } else {
                    ng.get('authoringWorkspace').open(item);
                    notify.success(gettext('Item Translated'));
                }

                this.props.closeModal();
            });
        }
    }

    render(): JSX.Element {
        const state = this.state;

        if (!state.initialized) {
            return null;
        }

        const targetLanguages = getTranslationTargetLanguages(
            state.availableLanguages ?? [],
            this.props.article.language,
        );

        return (
            <Modal
                visible
                onHide={() => this.props.closeModal()}
                size="small"
                headerTemplate={gettext('Translate')}
            >
                <Spacer v gap="16">
                    <Select
                        onChange={(value) => this.setState({
                            ...state,
                            selectedLanguage: value,
                        })}
                        label={gettext('Available languages')}
                        data-test-id="translate-modal--languages"
                    >
                        <Option />
                        {
                            targetLanguages.map((lang) => {
                                return (
                                    <Option key={lang._id} value={lang.language}>
                                        {gettext(lang.label)}
                                    </Option>
                                );
                            })
                        }
                    </Select>
                    <Spacer h gap="8" justifyContent="end" noWrap>
                        <Button
                            onClick={() => this.translate()}
                            text={gettext('Translate')}
                            type="primary"
                            disabled={(state.selectedLanguage?.length ?? 0) < 1}
                        />
                        <Button
                            onClick={() => this.props.closeModal()}
                            text={gettext('Cancel')}
                            type="default"
                        />
                    </Spacer>
                </Spacer>
            </Modal>
        );
    }
}

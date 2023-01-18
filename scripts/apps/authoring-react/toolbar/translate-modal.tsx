import {sdApi} from 'api';
import {httpRequestJsonLocal} from 'core/helpers/network';
import {Spacer} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';
import React from 'react';
import {IArticle, IRestApiResponse, ITranslation} from 'superdesk-api';
import {Button, Modal, Option, Select} from 'superdesk-ui-framework/react';

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

export default class TranslateModal extends React.PureComponent<IProps, IState> {
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
            return httpRequestJsonLocal({
                method: 'POST',
                path: '/archive/translate',
                payload: {
                    desk: sdApi.desks.getCurrentDeskId(),
                    language: this.state.selectedLanguage,
                    guid: this.props.article._id,
                },
            }).then(() => this.props.closeModal());
        }
    }

    render(): JSX.Element {
        const state = this.state;

        if (!state.initialized) {
            return null;
        }

        return (
            <Modal
                visible
                onHide={() => this.props.closeModal()}
                size="small"
                zIndex={1050}
                headerTemplate={gettext('Translate')}
            >
                <Spacer v gap="16">
                    <Select
                        onChange={(value) => this.setState({
                            ...state,
                            selectedLanguage: value,
                        })}
                        label={gettext('Available languages')}
                    >
                        <Option />
                        {
                            state.availableLanguages.map((lang) => {
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

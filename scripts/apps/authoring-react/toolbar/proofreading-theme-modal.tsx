/* eslint-disable react/no-multi-comp */
import React from 'react';
import {Button, ButtonGroup, Modal} from 'superdesk-ui-framework/react';
import ng from 'core/services/ng';
import {gettext} from 'core/utils';
import {PREFERENCES_KEY} from 'apps/authoring/authoring/services/AuthoringThemesService';
import {ProofreadingThemePanel} from './proofreading-theme-panel';

export interface ITheme {
    theme: string;
    themeColorSecondary: string;
    textColor: string;
    fontFamily: string;
    headline: IFontSizeOption;
    abstract: IFontSizeOption;
    body: IFontSizeOption;
}

export type IFontSizeOption = 'small' | 'medium' | 'large';

interface IState {
    defaultTheme?: ITheme;
    proofReadingTheme?: ITheme;
}

interface IProps {
    onHide(): void;
    onThemeChange(response: {default: ITheme, proofreading: ITheme}): void;
}

export class ProofreadingThemeModal extends React.Component<IProps, IState> {
    constructor(props) {
        super(props);

        this.state = {
            defaultTheme: null,
            proofReadingTheme: null,
        };
    }

    componentDidMount(): void {
        const authThemes = ng.get('authThemes');

        Promise.all([
            authThemes.get('theme'),
            authThemes.get('proofreadTheme'),
        ]).then(([defaultTheme, proofReadingTheme]) => {
            this.setState({defaultTheme, proofReadingTheme});
        });
    }

    render() {
        if (this.state.defaultTheme == null) {
            return null;
        }

        const footerTemplate = (
            <ButtonGroup align="end">
                <Button
                    text={gettext('Cancel')}
                    onClick={() => this.props.onHide()}
                />
                <Button
                    text={gettext('Save')}
                    type="primary"
                    onClick={() => {
                        const authThemes = ng.get('authThemes');

                        authThemes.saveBoth({
                            default: this.state.defaultTheme,
                            proofreading: this.state.proofReadingTheme,
                        }).then((res) => {
                            this.props.onThemeChange({
                                default: JSON.parse(res.user_preferences[PREFERENCES_KEY].theme),
                                proofreading: JSON.parse(res.user_preferences[PREFERENCES_KEY].proofreadTheme),
                            });
                            this.props.onHide();
                        });
                    }}
                />
            </ButtonGroup>
        );

        return (
            <Modal
                size="x-large"
                zIndex={1050}
                visible
                onHide={this.props.onHide}
                headerTemplate={gettext('Configure Editor themes')}
                footerTemplate={footerTemplate}
                contentPadding={'none'}
            >
                <div className="panel__wrapper">
                    <ProofreadingThemePanel
                        theme={this.state.defaultTheme}
                        title={gettext('Default Theme')}
                        badgeColor="green"
                        onChange={(theme: ITheme) => {
                            this.setState({defaultTheme: theme});
                        }}
                    />
                    <ProofreadingThemePanel
                        theme={this.state.proofReadingTheme}
                        title={gettext('Proofreading Theme')}
                        badgeColor="grey"
                        onChange={(theme: ITheme) => {
                            this.setState({proofReadingTheme: theme});
                        }}
                    />
                </div>
            </Modal>
        );
    }
}

/* eslint-disable react/no-multi-comp */
import React from 'react';
import {Button, ButtonGroup, Modal} from 'superdesk-ui-framework/react';
import ng from 'core/services/ng';
import {gettext} from 'core/utils';
import {IEditorTheme} from 'apps/authoring/authoring/editor-theme';
import {ProofreadingThemePanel} from './proofreading-theme-panel';

interface IState {
    defaultTheme?: IEditorTheme;
    proofReadingTheme?: IEditorTheme;
}

interface IProps {
    onHide(): void;
    onThemeChange(response: {default: IEditorTheme, proofreading: IEditorTheme}): void;
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
                    data-test-id="editor-themes-save"
                    onClick={() => {
                        const authThemes = ng.get('authThemes');

                        const themes = {
                            default: this.state.defaultTheme,
                            proofreading: this.state.proofReadingTheme,
                        };

                        authThemes.saveBoth(themes).then(() => {
                            this.props.onThemeChange(themes);
                            this.props.onHide();
                        });
                    }}
                />
            </ButtonGroup>
        );

        return (
            <Modal
                size="x-large"
                visible
                onHide={this.props.onHide}
                headerTemplate={gettext('Configure Editor themes')}
                footerTemplate={footerTemplate}
                contentPadding={'none'}
            >
                <div className="panel__wrapper" data-test-id="editor-themes-modal">
                    <ProofreadingThemePanel
                        theme={this.state.defaultTheme}
                        slot="default"
                        title={gettext('Default Theme')}
                        badgeColor="green"
                        onChange={(theme: IEditorTheme) => {
                            this.setState({defaultTheme: theme});
                        }}
                    />
                    <ProofreadingThemePanel
                        theme={this.state.proofReadingTheme}
                        slot="proofreading"
                        title={gettext('Proofreading Theme')}
                        badgeColor="grey"
                        onChange={(theme: IEditorTheme) => {
                            this.setState({proofReadingTheme: theme});
                        }}
                    />
                </div>
            </Modal>
        );
    }
}

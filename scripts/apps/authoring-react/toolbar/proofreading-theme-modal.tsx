/* eslint-disable react/no-multi-comp */
import React from 'react';
import classNames from 'classnames';
import {Button, ButtonGroup, Modal, Select, Option, RadioButtonGroup} from 'superdesk-ui-framework/react';
import ng from 'core/services/ng';
import {gettext} from 'core/utils';
import {Spacer} from 'core/ui/components/Spacer';
import {getTextColor} from 'core/helpers/utils';
import {PREFERENCES_KEY} from 'apps/authoring/authoring/services/AuthoringThemesService';

export interface ITheme {
    theme: string;
    themeShadow: string;
    textColor: string;
    fontFamily: string;
    headline: IFontSizeOptions;
    abstract: IFontSizeOptions;
    body: IFontSizeOptions;
}

interface IBackgroundColor {
    name: string;
    color: string;
    secondaryColor: string;
}

type IFontSizeOptions = 'small' | 'medium' | 'large';

interface IState {
    defaultTheme?: ITheme;
    proofReadingTheme?: ITheme;
}

interface IProps {
    onHide(): void;
    onThemeChange(response: {default: ITheme, proofreading: ITheme}): void;
}

export const availableThemes = [
    {name: 'default', color: '#ffffff', secondaryColor: '#f3f5f6'},
    {name: 'dark', color: '#1b1e19', secondaryColor: '#23282e'},
    {name: 'blue', color: '#06356a', secondaryColor: '#073e7d'},
    {name: 'turquoise', color: '#00ced1', secondaryColor: '#5ebeba'},
    {name: 'military', color: '#959f60', secondaryColor: '#909a5c'},
    {name: 'natural', color: '#efe9c5', secondaryColor: '#ebe3b7'},
];

const fontOptions = [
    {value: 'small', label: 'S'},
    {value: 'medium', label: 'M'},
    {value: 'large', label: 'L'},
];

const availableFonts = [
    {
        label: 'Sans-serif (Roboto)',
        fontFamily: '"Roboto", Helvetica, Arial, sans-serif',
    },
    {
        label: 'Serif (Merriweather)',
        fontFamily: '"Merriweather", Georgia, "Times New Roman", Times, serif',
    },
    {
        label: 'Monospace (Roboto Mono)',
        fontFamily: '"Roboto Mono", "Consolas", "monaco", monospace',
    },
];

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
                headerTemplate={'Configure Editor themes'}
                footerTemplate={footerTemplate}
                contentPadding={'none'}
            >
                <div className="sd-column-box--2">
                    <ProofreadingPanel
                        theme={this.state.defaultTheme}
                        title={gettext('Default Theme')}
                        onChange={(theme: ITheme) => {
                            this.setState({defaultTheme: theme});
                        }}
                    />
                    <ProofreadingPanel
                        theme={this.state.proofReadingTheme}
                        title={gettext('Proofreading Theme')}
                        onChange={(theme: ITheme) => {
                            this.setState({proofReadingTheme: theme});
                        }}
                    />
                </div>
            </Modal>
        );
    }
}

interface IPropsPanel {
    theme: ITheme;
    title: string;
    onChange: (val: ITheme) => void;
}

export class ProofreadingPanel extends React.Component<IPropsPanel> {
    render(): React.ReactNode {
        return (
            <div
                className={classNames(
                    'sd-column-box__main-column',
                    'sd-column-box__main-column--left',
                    'sd-column-box__main-column--padded',
                    'proofreading-panel',
                )}
            >
                <h2 className="modal__body-heading proofreading-panel__heading">
                    <Spacer justifyContent="start" alignItems="center" gap="4" noGrow>
                        <span className="badge badge--success proofreading-panel__badge">
                            &nbsp;
                        </span>
                        <span>
                            {gettext(this.props.title)}
                        </span>
                    </Spacer>
                </h2>

                <div className="form__row">
                    <Select
                        label={gettext('Font')}
                        value={this.props.theme.fontFamily}
                        onChange={(value) => {
                            this.props.onChange({
                                ...this.props.theme,
                                fontFamily: value,
                            });
                        }}
                    >
                        {availableFonts.map((option, index) => {
                            return <Option key={index} value={option.fontFamily}>{option.label}</Option>;
                        })}
                    </Select>
                </div>

                <ThemeSelector
                    value={this.props.theme.theme}
                    options={availableThemes}
                    onChange={(item) => {
                        this.props.onChange({
                            ...this.props.theme,
                            theme: item.color,
                            themeShadow: item.secondaryColor,
                            textColor: getTextColor(item.color),
                        });
                    }}
                />

                <div
                    className="theme-preview"
                    style={{
                        backgroundColor: this.props.theme.theme,
                        color: getTextColor(this.props.theme.theme),
                    }}
                >
                    <div className="theme-preview__block">
                        <label className="theme-preview__label">{gettext('Headline')}</label>

                        <div
                            className="theme-preview__text-field text-field__headline"
                            style={{
                                fontFamily: this.props.theme.fontFamily,
                                fontSize: this.props.theme.headline,
                            }}
                        >
                            Vestibulum ante ipsum primis in faucibus.
                        </div>

                        <div className="form__row form__row--flex">
                            <RadioButtonGroup
                                value={this.props.theme.headline}
                                group={{align: 'end'}}
                                options={fontOptions}
                                onChange={(value: IFontSizeOptions) => {
                                    this.props.onChange({
                                        ...this.props.theme,
                                        headline: value,
                                    });
                                }}
                            />
                        </div>
                    </div>

                    <div className="theme-preview__block">
                        <label className="theme-preview__label">{gettext('Abstract')}</label>

                        <div
                            className="theme-preview__text-field text-field__abstract"
                            style={{
                                fontFamily: this.props.theme.fontFamily,
                                fontSize: this.props.theme.abstract,
                            }}
                        >
                            Vestibulum ante ipsum primis in faucibus orci luctus et
                            ultrices posuere cubilia Curae; Fusce id purus.
                            Phasellus ullamcorper…
                        </div>

                        <div className="form__row form__row--flex">
                            <RadioButtonGroup
                                value={this.props.theme.abstract}
                                group={{align: 'end'}}
                                options={fontOptions}
                                onChange={(value: IFontSizeOptions) => {
                                    this.props.onChange({
                                        ...this.props.theme,
                                        abstract: value,
                                    });
                                }}
                            />
                        </div>
                    </div>

                    <div className="theme-preview__block">
                        <label className="theme-preview__label">{gettext('Body')}</label>

                        <div
                            className="theme-preview__text-field text-field__body"
                            style={{
                                fontFamily: this.props.theme.fontFamily,
                                fontSize: this.props.theme.body,
                            }}
                        >
                            Vestibulum ante ipsum primis in faucibus orci luctus et
                            ultrices posuere cubilia Curae; Fusce id purus.
                            Phasellus ullamcorper…
                        </div>

                        <div className="form__row form__row--flex">
                            <RadioButtonGroup
                                value={this.props.theme.body}
                                group={{align: 'end'}}
                                options={fontOptions}
                                onChange={(value: IFontSizeOptions) => {
                                    this.props.onChange({
                                        ...this.props.theme,
                                        body: value,
                                    });
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

interface IPropsThemeSelector {
    value: string;
    options: Array<IBackgroundColor>;
    onChange(value: IBackgroundColor): void;
}

export class ThemeSelector extends React.Component<IPropsThemeSelector> {
    render() {
        return (
            <div className="color-swatch__list">
                {this.props.options.map((item, index: number) => {
                    return (
                        <div
                            key={index}
                            className={
                                `color-swatch ${this.props.value === item.color ? 'color-swatch--selected' : ''}`
                            }
                        >
                            <span
                                className="color-swatch__inner"
                                style={{
                                    backgroundColor: `${item.color}`,
                                    color: getTextColor(item.color),
                                }}
                                onClick={() => this.props.onChange(item)}
                            >
                                a
                            </span>
                        </div>
                    );
                })}
            </div>
        );
    }
}

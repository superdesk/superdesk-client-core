import React from 'react';
import classNames from 'classnames';
import {Button, ButtonGroup, Modal, Select, Option, RadioButtonGroup} from 'superdesk-ui-framework/react';
import ng from 'core/services/ng';
import {gettext} from 'core/utils';

interface IProps {
    onHide(): void;
}

interface IBackgroundColor {
    name?: string;
    color?: string;
}

interface IState {
    defaultTheme?: ITheme;
    proofReadingTheme?: ITheme;
}

type IFontSizeOptions = 'small' | 'medium' | 'large';

export interface ITheme {
    font: string;
    theme: string;
    headline: IFontSizeOptions;
    abstract: IFontSizeOptions;
    body: IFontSizeOptions;
}

const availableColors = [
    {name: 'default', color: '#ffffff'},
    {name: 'dark', color: '#1b1e19'},
    {name: 'blue', color: '#1b4473f2'},
    {name: 'turquoise', color: '#00ced1'},
    {name: 'military', color: '#959f60'},
    {name: 'natural', color: '#efe9c5'},
];

const radioButtonOptions = [
    {value: 'small', label: 'S'},
    {value: 'medium', label: 'M'},
    {value: 'large', label: 'L'},
];

const fontOptions = [
    {
        label: 'Sans-serif (Roboto)',
        key: 'sans',
    },
    {
        label: 'Serif (Merriweather)',
        key: 'serif',
    },
    {
        label: 'Monospace (Roboto Mono)',
        key: 'mono',
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

        const footerTemplate = <ButtonGroup align="end">
            <Button text={gettext('Cancel')} onClick={() => this.props.onHide()}/>
            <Button
                type='primary'
                text={gettext('Save')}
                onClick={() => {
                    const authThemes = ng.get('authThemes');

                    authThemes.save('theme', this.state.defaultTheme);
                    authThemes.save('proofreadTheme', this.state.proofReadingTheme);

                    this.props.onHide();
                }}
            />
        </ButtonGroup>;

        return (
            <Modal
                size='x-large'
                zIndex={1050}
                visible
                onHide={this.props.onHide}
                headerTemplate={'Configure Editor themes'}
                footerTemplate={footerTemplate}
                contentPadding={'none'}>
                <div className="">
                    <div className="sd-column-box--2">
                        <div
                            className="
                            sd-column-box__main-column
                            sd-column-box__main-column--left
                            sd-column-box__main-column--padded
                            proofreading-modal">
                            <h2 className="modal__body-heading proofreading-modal__heading">
                                <span className="badge badge--success proofreading-modal__badge">
                                    &nbsp;
                                </span>
                                {gettext('Default Theme')}
                            </h2>

                            <div className="form__row">
                                <FontSelect
                                    value={this.state.defaultTheme.font}
                                    onChange={(value) => {
                                        this.setState({
                                            defaultTheme: {
                                                ...this.state.defaultTheme,
                                                font: value,
                                            },
                                        });
                                    }}
                                />
                            </div>

                            <ColorSwatch
                                value={this.state.defaultTheme.theme}
                                options={availableColors}
                                onChange={(item) => {
                                    this.setState({
                                        defaultTheme: {
                                            ...this.state.defaultTheme,
                                            theme: item.name,
                                        },
                                    });
                                }}
                            />

                            <div className={`
                                theme-preview
                                sd-editor--theme-${this.state.defaultTheme.theme}
                                sd-editor--headline-${this.state.defaultTheme.headline}
                                sd-editor--abstract-${this.state.defaultTheme.abstract}
                                sd-editor--body-${this.state.defaultTheme.body}
                                sd-editor--font-${this.state.defaultTheme.font}
                            `}>
                                <div className="theme-preview__block">
                                    <label className="theme-preview__label">{gettext('Headline')}</label>

                                    <div className="theme-preview__text-field text-field__headline">
                                        'This is the headline'
                                    </div>

                                    <div className='form__row form__row--flex'>
                                        <RadioButtonGroup
                                            value={this.state.defaultTheme.headline}
                                            group={{align: 'end'}}
                                            options={radioButtonOptions}
                                            onChange={(value: IFontSizeOptions) => {

                                                this.setState({
                                                    defaultTheme: {
                                                        ...this.state.defaultTheme,
                                                        headline: value,
                                                    },
                                                });
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="theme-preview__block">
                                    <label className="theme-preview__label">{gettext('Abstract')}</label>

                                    <div className="theme-preview__text-field text-field__abstract">
                                        'Abstract example'
                                    </div>

                                    <div className='form__row form__row--flex'>
                                        <RadioButtonGroup
                                            value={this.state.defaultTheme.abstract}
                                            group={{align: 'end'}}
                                            options={radioButtonOptions}
                                            onChange={(value: IFontSizeOptions) => {
                                                this.setState({
                                                    defaultTheme: {
                                                        ...this.state.defaultTheme,
                                                        abstract: value,
                                                    },
                                                });
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="theme-preview__block">
                                    <label className="theme-preview__label">{gettext('Body')}</label>

                                    <div className="theme-preview__text-field text-field__body">
                                        'Body text example'
                                    </div>

                                    <div className='form__row form__row--flex'>
                                        <RadioButtonGroup
                                            value={this.state.defaultTheme.body}
                                            group={{align: 'end'}}
                                            options={radioButtonOptions}
                                            onChange={(value: IFontSizeOptions) => {
                                                this.setState({
                                                    defaultTheme: {
                                                        ...this.state.defaultTheme,
                                                        body: value,
                                                    },
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            className="
                            sd-column-box__main-column
                            sd-column-box__main-column--right
                            sd-column-box__main-column--padded
                            proofreading-modal">
                            <h2 className="modal__body-heading proofreading-modal__heading">
                                <span className="badge badge--success proofreading-modal__badge">
                                    &nbsp;
                                </span>
                                {gettext('Proofreading Theme')}
                            </h2>

                            <div className="form__row">
                                <FontSelect
                                    value={this.state.proofReadingTheme.font}
                                    onChange={(value) => {
                                        this.setState({
                                            proofReadingTheme: {
                                                ...this.state.proofReadingTheme,
                                                font: value,
                                            },
                                        });
                                    }}
                                />
                            </div>

                            <ColorSwatch
                                value={this.state.proofReadingTheme.theme}
                                options={availableColors}
                                onChange={(item: IBackgroundColor) => {
                                    this.setState({
                                        proofReadingTheme: {
                                            ...this.state.proofReadingTheme,
                                            theme: item.name,
                                        },
                                    });
                                }}
                            />

                            <div
                            className={`
                                theme-preview
                                sd-editor--theme-${this.state.proofReadingTheme.theme}
                                sd-editor--headline-${this.state.proofReadingTheme.headline}
                                sd-editor--abstract-${this.state.proofReadingTheme.abstract}
                                sd-editor--body-${this.state.proofReadingTheme.body}
                                sd-editor--font-${this.state.proofReadingTheme.font}
                            `}>
                                <div className="theme-preview__block">
                                    <label className="theme-preview__label">{gettext('Headline')}</label>

                                    <div className="theme-preview__text-field text-field__headline">
                                        'This is the headline'
                                    </div>

                                    <div className='form__row form__row--flex'>
                                        <RadioButtonGroup
                                            value={this.state.proofReadingTheme.headline}
                                            group={{align: 'end'}}
                                            options={radioButtonOptions}
                                            onChange={(value: IFontSizeOptions) => {
                                                this.setState({
                                                    proofReadingTheme: {
                                                        ...this.state.proofReadingTheme,
                                                        headline: value,
                                                    },
                                                });
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="theme-preview__block">
                                    <label className="theme-preview__label">{gettext('Abstract')}</label>

                                    <div className="theme-preview__text-field text-field__abstract">
                                        'Body text example'. Vestibulum ante ipsum primis
                                        in faucibus orci luctus et ultrices posuere cubilia
                                        Curae; Fusce id purus. Phasellus ullamcorper…
                                    </div>

                                    <div className='form__row form__row--flex'>
                                        <RadioButtonGroup
                                            value={this.state.proofReadingTheme.abstract}
                                            group={{align: 'end'}}
                                            options={radioButtonOptions}
                                            onChange={(value: IFontSizeOptions) => {
                                                this.setState({
                                                    proofReadingTheme: {
                                                        ...this.state.proofReadingTheme,
                                                        abstract: value,
                                                    },
                                                });
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="theme-preview__block">
                                    <label className="theme-preview__label">{gettext('Body')}</label>

                                    <div className="theme-preview__text-field text-field__body">
                                        'Body text example'. Vestibulum ante ipsum primis
                                        in faucibus orci luctus et ultrices posuere cubilia
                                        Curae; Fusce id purus. Phasellus ullamcorper…
                                    </div>

                                    <div className='form__row form__row--flex'>
                                        <RadioButtonGroup
                                            value={this.state.proofReadingTheme.body}
                                            group={{align: 'end'}}
                                            options={radioButtonOptions}
                                            onChange={(value: IFontSizeOptions) => {
                                                this.setState({
                                                    proofReadingTheme: {
                                                        ...this.state.proofReadingTheme,
                                                        body: value,
                                                    },
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }
}

interface IPropsColorSwatch {
    value: string;
    options: Array<IBackgroundColor>;
    onChange(value: IBackgroundColor): void;
}

export class ColorSwatch extends React.Component<IPropsColorSwatch> {

    render() {
        return (
            <div className="color-swatch__list">
                {this.props.options.map((item: any, index: number) => {
                    return (
                        <div
                            key={index}
                            className={`color-swatch ${this.props.value === item.name
                            ? 'color-swatch--selected'
                            : ''}`}>
                                <span
                                    className="color-swatch__inner"
                                    style={{backgroundColor: `${item.color}`}}
                                    onClick={() => this.props.onChange(item)}>
                                    a
                                </span>
                        </div>
                    );
                })}
            </div>
        );
    }
}

interface IPropsFontSelect {
    value: string;
    onChange(value: string): void;
}

export class FontSelect extends React.Component<IPropsFontSelect> {

    render() {
        return (
            <Select
                label='Font'
                value={this.props.value}
                onChange={(value) => {
                    this.props.onChange(value);
                }}>
                {fontOptions.map((option) => {
                    return <Option key={option.key} value={option.key}>{option.label}</Option>;
                })}
            </Select>
        );
    }
}

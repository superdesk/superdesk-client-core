import React from 'react';
import {Select, Option, RadioButtonGroup} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {Spacer} from 'core/ui/components/Spacer';
import {getTextColor} from 'core/helpers/utils';
import {ThemeSelector} from './theme-selector';
import {IFontSizeOptions, ITheme} from './proofreading-theme-modal';
import {getUiThemeFontSize, getUiThemeFontSizeHeading} from '../authoring-react';

interface IPropsPanel {
    theme: ITheme;
    title: string;
    badge: string;
    onChange: (val: ITheme) => void;
}

export const availableThemes = [
    {name: 'default', color: '#ffffff', secondaryColor: '#f3f5f6'},
    {name: 'dark', color: '#1b1e19', secondaryColor: '#23282e'},
    {name: 'blue', color: '#06356a', secondaryColor: '#073e7d'},
    {name: 'turquoise', color: '#00ced1', secondaryColor: '#5ebeba'},
    {name: 'military', color: '#959f60', secondaryColor: '#909a5c'},
    {name: 'natural', color: '#efe9c5', secondaryColor: '#ebe3b7'},
];

export const fontOptions = [
    {value: 'small', label: 'S'},
    {value: 'medium', label: 'M'},
    {value: 'large', label: 'L'},
];

export const availableFonts = [
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

export class ProofreadingThemePanel extends React.Component<IPropsPanel> {
    render(): React.ReactNode {
        return (
            <div className='proofreading-panel'>
                <div className='proofreading-panel-header'>
                    <Spacer v gap='16'>
                        <h2 className="proofreading-panel__heading">
                            <Spacer justifyContent="start" alignItems="center" gap="4" noGrow>
                                <span className={`proofreading-panel__badge proofreading-panel__badge--${this.props.badge}`}>
                                    &nbsp;
                                </span>
                                <span>
                                    {gettext(this.props.title)}
                                </span>
                            </Spacer>
                        </h2>

                        <div className="proofreading-panel__font-select">
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
                                    themeColorSecondary: item.secondaryColor,
                                    textColor: getTextColor(item.color),
                                });
                            }}
                        />
                    </Spacer>
                </div>

                <div
                    className="proofreading-panel-content"
                    style={{
                        backgroundColor: this.props.theme.theme,
                        color: getTextColor(this.props.theme.theme),
                    }}
                >
                    <Spacer v gap='16'>
                        <div className="proofreading-panel-content__block">
                            <label className="proofreading-panel-content__label">{gettext('Headline')}</label>

                            <div
                                className="proofreading-panel-content__text-field proofreading-panel-content__text-field--headline"
                                style={{
                                    fontFamily: this.props.theme.fontFamily,
                                    fontSize: getUiThemeFontSizeHeading(this.props.theme.headline),
                                }}
                            >
                                Vestibulum ante ipsum primis.
                            </div>

                            <div className="proofreading-panel-content__radio-button">
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

                        <div className="proofreading-panel-content__block">
                            <label className="proofreading-panel-content__label">{gettext('Abstract')}</label>

                            <div
                                className="proofreading-panel-content__text-field proofreading-panel-content__text-field--abstract"
                                style={{
                                    fontFamily: this.props.theme.fontFamily,
                                    fontSize: getUiThemeFontSize(this.props.theme.abstract),
                                }}
                            >
                                Vestibulum ante ipsum primis in faucibus orci luctus et
                                ultrices posuere cubilia Curae; Fusce id purus.
                                Phasellus ullamcorper…
                            </div>

                            <div className="proofreading-panel-content__radio-button">
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

                        <div className="proofreading-panel-content__block">
                            <label className="proofreading-panel-content__label">{gettext('Body')}</label>

                            <div
                                className="proofreading-panel-content__text-field proofreading-panel-content__text-field--body"
                                style={{
                                    fontFamily: this.props.theme.fontFamily,
                                    fontSize: getUiThemeFontSize(this.props.theme.body),
                                }}
                            >
                                Vestibulum ante ipsum primis in faucibus orci luctus et
                                ultrices posuere cubilia Curae; Fusce id purus.
                                Phasellus ullamcorper…
                            </div>

                            <div className="proofreading-panel-content__radio-button">
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
                    </Spacer>
                </div>
            </div>
        );
    }
}

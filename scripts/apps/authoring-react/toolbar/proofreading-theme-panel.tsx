import React from 'react';
import {Select, Option, RadioButtonGroup} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {Spacer} from 'core/ui/components/Spacer';
import {BackgroundColorSelector} from './theme-selector';
import {getUiThemeFontSize, getUiThemeFontSizeHeading} from '../authoring-react';
import {assertNever} from 'core/helpers/typescript-helpers';
import {
    getEditorThemeColor,
    getEditorThemeColors,
    getEditorThemeFonts,
    getEditorThemeStyle,
    IEditorTheme,
    IEditorThemeFont,
    IFontSizeOption,
} from 'apps/authoring/authoring/editor-theme';

interface IPropsPanel {
    slot: 'default' | 'proofreading';
    theme: IEditorTheme;
    title: string;
    badgeColor: 'green' | 'grey';
    onChange: (val: IEditorTheme) => void;
}

interface IFontOption {
    value: IFontSizeOption;
    label: string;
}

const fontOptions: Array<IFontOption> = [
    {value: 'small', label: 'S'},
    {value: 'medium', label: 'M'},
    {value: 'large', label: 'L'},
];

export class ProofreadingThemePanel extends React.Component<IPropsPanel> {
    render(): React.ReactNode {
        let classes = 'proofreading-panel-content__text-field';
        let headlineClasses = `${classes} proofreading-panel-content__text-field--headline`;
        let bodyClasses = `${classes} proofreading-panel-content__text-field--body`;
        let abstractClasses = `${classes} proofreading-panel-content__text-field--abstract`;
        const themeStyle = getEditorThemeStyle(this.props.theme);

        return (
            <div className="proofreading-panel" data-test-id="proofreading-panel" data-test-value={this.props.slot}>
                <div className="proofreading-panel-header">
                    <Spacer v gap="16">
                        <h2 className="proofreading-panel__heading">
                            <Spacer justifyContent="start" alignItems="center" gap="4" noGrow>
                                {
                                    (() => {
                                        let badgeClasses: string = 'proofreading-panel__badge';

                                        if (this.props.badgeColor === 'green') {
                                            badgeClasses += ' proofreading-panel__badge--green';
                                        } else if (this.props.badgeColor === 'grey') {
                                            badgeClasses += ' proofreading-panel__badge--grey';
                                        } else {
                                            assertNever(this.props.badgeColor);
                                        }

                                        return (
                                            <span className={badgeClasses}>
                                                &nbsp;
                                            </span>
                                        );
                                    })()
                                }
                                <span>
                                    {this.props.title}
                                </span>
                            </Spacer>
                        </h2>

                        <div className="proofreading-panel__font-select">
                            <Select
                                label={gettext('Font')}
                                value={this.props.theme.font}
                                onChange={(value) => {
                                    this.props.onChange({
                                        ...this.props.theme,
                                        font: value as IEditorThemeFont,
                                    });
                                }}
                            >
                                {getEditorThemeFonts().map((option) => {
                                    return <Option key={option.key} value={option.key}>{option.label}</Option>;
                                })}
                            </Select>
                        </div>

                        <BackgroundColorSelector
                            value={getEditorThemeColor(this.props.theme)}
                            options={getEditorThemeColors()}
                            onChange={(item) => {
                                this.props.onChange({
                                    ...this.props.theme,
                                    theme: item.key,
                                });
                            }}
                        />
                    </Spacer>
                </div>

                <div
                    className="proofreading-panel-content"
                    style={{
                        backgroundColor: themeStyle.backgroundColor,
                        color: themeStyle.textColor,
                    }}
                >
                    <Spacer v gap="16">
                        <div className="proofreading-panel-content__block">
                            <label className="proofreading-panel-content__label">
                                {gettext('Headline')}
                            </label>

                            <div
                                className={headlineClasses}
                                style={{
                                    fontFamily: themeStyle.fontFamily,
                                    fontSize: getUiThemeFontSizeHeading(this.props.theme.headline),
                                }}
                            >
                                Vestibulum ante ipsum primis.
                            </div>

                            <div className="proofreading-panel-content__radio-button">
                                <RadioButtonGroup
                                    value={this.props.theme.headline}
                                    group={{align: 'end'}}
                                    data-test-id="theme-headline-size"
                                    options={fontOptions}
                                    onChange={(value: IFontSizeOption) => {
                                        this.props.onChange({
                                            ...this.props.theme,
                                            headline: value,
                                        });
                                    }}
                                />
                            </div>
                        </div>

                        <div className="proofreading-panel-content__block">
                            <label className="proofreading-panel-content__label">
                                {gettext('Abstract')}
                            </label>

                            <div
                                className={abstractClasses}
                                style={{
                                    fontFamily: themeStyle.fontFamily,
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
                                    data-test-id="theme-abstract-size"
                                    options={fontOptions}
                                    onChange={(value: IFontSizeOption) => {
                                        this.props.onChange({
                                            ...this.props.theme,
                                            abstract: value,
                                        });
                                    }}
                                />
                            </div>
                        </div>

                        <div className="proofreading-panel-content__block">
                            <label className="proofreading-panel-content__label">
                                {gettext('Body')}
                            </label>

                            <div
                                className={bodyClasses}
                                style={{
                                    fontFamily: themeStyle.fontFamily,
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
                                    data-test-id="theme-body-size"
                                    options={fontOptions}
                                    onChange={(value: IFontSizeOption) => {
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

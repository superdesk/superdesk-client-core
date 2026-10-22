import React from 'react';
import classNames from 'classnames';
import {IEditorThemeColorOption} from 'apps/authoring/authoring/editor-theme';

interface IPropsThemeSelector {
    value: IEditorThemeColorOption;
    options: Array<IEditorThemeColorOption>;
    onChange(value: IEditorThemeColorOption): void;
}

export class BackgroundColorSelector extends React.Component<IPropsThemeSelector> {
    render() {
        return (
            <div className="color-selector__list">
                {this.props.options.map((item) => {
                    const selected = this.props.value?.key === item.key;
                    const swatchClasses = classNames('color-selector__swatch', {
                        'color-selector__swatch--selected': selected,
                    });

                    return (
                        <div
                            key={item.key}
                            className={swatchClasses}
                            data-test-id="theme-color"
                            data-test-value={item.key}
                        >
                            <span
                                className="color-selector__swatch-content"
                                style={{
                                    backgroundColor: item.color,
                                    color: item.textColor,
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

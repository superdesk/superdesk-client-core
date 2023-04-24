import React from 'react';
import {getTextColor} from 'core/helpers/utils';

interface IPropsThemeSelector {
    value: string;
    options: Array<IBackgroundColor>;
    onChange(value: IBackgroundColor): void;
}

interface IBackgroundColor {
    name: string;
    color: string;
    secondaryColor: string;
}

export class ThemeSelector extends React.Component<IPropsThemeSelector> {
    render() {
        return (
            <div className="color-selector__list">
                {this.props.options.map((item, index: number) => {
                    return (
                        <div
                            key={index}
                            className={
                                `color-selector__swatch ${this.props.value === item.color ? 'color-selector__swatch--selected' : ''}`
                            }
                        >
                            <span
                                className="color-selector__swatch-content"
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

import React from 'react';
import {getTextColor} from 'core/helpers/utils';
import classNames from 'classnames';

interface IPropsThemeSelector {
    value: IBackgroundColor;
    options: Array<IBackgroundColor>;
    onChange(value: IBackgroundColor): void;
}

export interface IBackgroundColor {
    name: string;
    color: string;
    secondaryColor: string;
}

export class BackgroundColorSelector extends React.Component<IPropsThemeSelector> {
    render() {
        
        return (
            <div className="color-selector__list">
                {this.props.options.map((item, index: number) => {
                    const swatchClasses = classNames('color-selector__swatch', {
                        'color-selector__swatch--selected': this.props.value === item,
                    })
                    
                    return (
                        <div
                            key={index}
                            className={swatchClasses}
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

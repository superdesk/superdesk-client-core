import React from 'react';
import classNames from 'classnames';

interface IProps {
    field?: string;
    label?: string;
    labelPosition: 'left' | 'right' | 'inside';
    value: boolean | string;
    checkedValue: string;
    onChange(field: IProps['field'] | undefined, value: IProps['value']): void;
    readOnly: boolean;
    type: 'radio' | 'checkbox';
}

// Component to show checkbox input in styles including radiobutton
export class Checkbox extends React.Component<IProps> {
    static defaultProps = {
        value: false,
        checkedValue: '',
        readOnly: false,
        labelPosition: 'right',
        type: 'checkbox',
    };

    render() {

        const {
            field,
            value,
            checkedValue,
            label,
            labelPosition,
            readOnly,
            onChange,
            type,
        } = this.props;

        const isRadio = type === 'radio';
        const onClick = readOnly ?
            null :
            (event) => {
                event.stopPropagation();
                onChange(field, isRadio ? checkedValue : !value);
            };

        const className = classNames(
            'sd-checkbox',
            {
                'sd-checkbox--disabled': readOnly,
                'sd-checkbox--button-style': labelPosition === 'inside',
                'sd-checkbox--radio': isRadio,
                checked: isRadio ? value === checkedValue : value,
            },
        );

        let checkbox;

        if (labelPosition === 'inside') {
            checkbox = (
                <a className="sd-check__wrapper" onClick={onClick}>
                    <span className={className}>
                        <label className={readOnly ? 'sd-label--disabled' : ''}>
                            {label}
                        </label>
                    </span>
                </a>
            );
        } else if (labelPosition === 'left') {
            checkbox = (
                <a className="sd-check__wrapper" onClick={onClick}>
                    <label className={readOnly ? 'sd-label--disabled' : ''}>
                        {label}
                    </label>
                    <span className={className}/>
                </a>
            );
        } else {
            checkbox = (
                <a className="sd-check__wrapper" onClick={onClick}>
                    <span className={className}/>
                    <label className={readOnly ? 'sd-label--disabled' : ''}>
                        {label}
                    </label>
                </a>
            );
        }

        return checkbox;
    }
}

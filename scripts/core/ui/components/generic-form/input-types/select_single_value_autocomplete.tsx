import React from 'react';
import classNames from 'classnames';
import {IInputType} from '../interfaces/input-types';
import {AutoComplete} from '../../Autocomplete';

type IProps = IInputType<string>;

export function getSelectSingleValueAutoComplete(
    endpoint: string,
    sort: {field: string; direction: 'ascending' | 'descending'},
    placeholder: string,
    getLabel: (item) => string,
    getDependentFields?: (props: IProps) => Array<string>,
) {
    return class SelectSingleValue extends React.Component<IProps> {
        dependentFields: Array<string>;
        initialValue: string | undefined;

        constructor(props: IProps) {
            super(props);

            this.state = {
                items: null,
            };

            this.initialValue = props.value;

            this.dependentFields = typeof getDependentFields === 'function'
                ? getDependentFields(props)
                : [];

        }
        componentDidUpdate(prevProps: IProps) {
            if (
                this.dependentFields.some((field) => prevProps.formValues[field] !== this.props.formValues[field])
            ) {
                this.props.onChange(this.initialValue); // resetting the value since dependent field changed
            }
        }
        render() {
            return (
                <div className={
                    classNames(
                        'sd-line-input',
                        {
                            'sd-line-input--invalid': this.props.issues.length > 0,
                            'sd-line-input--required': this.props.formField.required === true,
                        },
                    )
                }>
                    <label className="sd-line-input__label">{this.props.formField.label}</label>
                    <AutoComplete
                        endpoint={endpoint}
                        placeholder={placeholder}
                        sort={sort}
                        getLabel={(item) => getLabel(item)}
                        onSelect={(item) => {
                            this.props.onChange(item._id);
                        }}
                        disabled={this.props.disabled}
                        selected={this.props.value}
                        data-test-id={`gform-input--${this.props.formField.field}`}
                    />
                    {
                        this.props.issues.map((str, i) => (
                            <div key={i} className="sd-line-input__message">{str}</div>
                        ))
                    }
                </div>
            );
        }
    };
}

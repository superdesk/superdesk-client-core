import React from 'react';
import classNames from 'classnames';
import {IInputType} from '../interfaces/input-types';
import {gettext} from 'core/utils';

type ISelectSingleValueItems = Array<{id: string, label: string}>;

type IProps = IInputType<string>;

interface IState {
    items: ISelectSingleValueItems;
}

export function getSelectSingleValue(
    getItems: (props: IProps) => Promise<ISelectSingleValueItems>,
    itemsUnavailableMessage?: string,
    getDependentFields?: (props: IProps) => Array<string>,
) {
    return class SelectSingleValue extends React.Component<IProps, IState> {
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

            this.fetchData = this.fetchData.bind(this);
        }
        fetchData() {
            getItems(this.props)
                .then((items) => {
                    this.setState({items});
                });
        }
        componentDidMount() {
            this.fetchData();
        }
        componentDidUpdate(prevProps: IProps) {
            if (
                this.dependentFields.some((field) => prevProps.formValues[field] !== this.props.formValues[field])
            ) {
                this.props.onChange(this.initialValue); // resetting the value since dependent field changed
                this.fetchData();
            }
        }
        render() {
            if (this.props.previewOutput) {
                if (this.state.items == null) {
                    return null; // loading
                } else {
                    let item = this.state.items.find(({id}) => id === this.props.value);

                    return item == null ? <div>{this.props.value}</div> : <div>{item.label}</div>;
                }
            }

            const getFirstItemMessage = () => {
                if (this.state.items == null) {
                    return itemsUnavailableMessage != null ? itemsUnavailableMessage : '';
                } else if (this.state.items.length < 1) {
                    return gettext('No items available');
                } else {
                    return '';
                }
            };

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
                    <select
                        disabled={this.props.disabled || this.state.items == null || this.state.items.length < 1}
                        value={this.props.value || ''}
                        className="sd-line-input__select"
                        onChange={(event) => {
                            this.props.onChange(event.target.value === '' ? this.initialValue : event.target.value);
                        }}
                        data-test-id={`gform-input--${this.props.formField.field}`}
                    >
                        <option value="">{getFirstItemMessage()}</option>
                        {
                            this.state.items == null
                                ? null
                                : this.state.items.map(({id, label}, i) => (
                                    <option key={i} value={id}>{label}</option>
                                ))
                        }
                    </select>
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

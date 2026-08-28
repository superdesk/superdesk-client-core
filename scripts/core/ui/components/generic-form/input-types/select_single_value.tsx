import React from 'react';
import classNames from 'classnames';
import {IInputType} from '../interfaces/input-types';
import {gettext} from 'core/utils';
import {Option, Select} from 'superdesk-ui-framework';

type ISelectSingleValueItems = Array<{id: string; label: string}>;

type IProps = IInputType<string>;

interface IState {
    items: ISelectSingleValueItems | null;
    loading: boolean;
}

export function getSelectSingleValue(
    getItems: (props: IProps) => Promise<ISelectSingleValueItems>,
    itemsUnavailableMessage?: string,
    getDependentFields?: (props: IProps) => Array<string>,
) {
    return class SelectSingleValue extends React.Component<IProps, IState> {
        dependentFields: Array<string>;
        initialValue: string | undefined;
        private _mounted: boolean;

        constructor(props: IProps) {
            super(props);

            this.state = {
                items: null,
                loading: true,
            };

            this.initialValue = props.value;

            this.dependentFields = typeof getDependentFields === 'function'
                ? getDependentFields(props)
                : [];

            this.fetchData = this.fetchData.bind(this);
        }

        fetchData() {
            this.setState({loading: true});

            getItems(this.props)
                .then((items) => {
                    if (this._mounted) {
                        this.setState({items, loading: false});
                    }
                });
        }

        componentDidMount() {
            this._mounted = true;

            this.fetchData();
        }

        componentWillUnmount() {
            this._mounted = false;
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
            if (this.state.loading) {
                return null;
            }

            const items = this.state.items ?? [];

            if (this.props.previewOutput) {
                let item = items.find(({id}) => id === this.props.value);

                return item == null ? <div>{this.props.value}</div> : <div>{item.label}</div>;
            }

            const extraIssueElements = (this.props.issues ?? []).slice(1).map((str, i) => (
                <div key={i} className="sd-line-input__message">{str}</div>
            ));

            /*
                A value that no item matches still has to be listed, otherwise the native select
                would display an unrelated item while the form keeps the original value.
                It happens when a stored value is no longer offered, and when the items could not
                be fetched at all.
            */
            const valueMissingFromItems = this.props.value != null
                && this.props.value !== ''
                && items.every(({id}) => id !== this.props.value);

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
                <div
                    className={classNames(
                        'd-flex',
                        'flex-col',
                    )}
                >
                    <Select
                        fullWidth
                        value={this.props.value}
                        onChange={this.props.onChange}
                        labelHidden={!this.props.formField.label}
                        label={this.props.formField.label}
                        required={this.props.formField.required}
                        invalid={(this.props.issues ?? []).length > 0}
                        data-test-id={`gform-input--${this.props.formField.field}`}
                        error={this.props.issues[0]}
                        disabled={this.props.disabled}
                    >
                        <Option value="">{getFirstItemMessage()}</Option>
                        {
                            items.map(({id, label}, i) => (
                                <Option key={i} value={id}>{label}</Option>
                            ))
                        }
                        {
                            valueMissingFromItems
                                ? <Option value={this.props.value}>{this.props.value}</Option>
                                : null
                        }
                    </Select>
                    {extraIssueElements}
                </div>
            );
        }
    };
}

import React from 'react';
import classNames from 'classnames';
import {IInputType} from '../interfaces/input-types';
import {AutoComplete} from '../../Autocomplete';
import {IRestApiResponse} from 'superdesk-api';

type IProps = IInputType<string>;

interface IState {
    item?: any;
}

export function getSelectSingleValueAutoComplete(
    query: (searchString: string, props: IProps) => Promise<IRestApiResponse<any>>,
    queryById: (id: string) => Promise<any>,
    getPlaceholder: (props: IProps) => string,
    getLabel: (item) => string,
    getDependentFields?: (props: IProps) => Array<string>,
) {
    return class SelectSingleValueAutoComplete extends React.Component<IProps, IState> {
        dependentFields: Array<string>;
        initialValue: string | undefined;
        updateCount: number;

        constructor(props: IProps) {
            super(props);

            this.state = {};

            this.initialValue = props.value;
            this.updateCount = 0;

            this.dependentFields = typeof getDependentFields === 'function'
                ? getDependentFields(props)
                : [];

        }
        componentDidUpdate(prevProps: IProps) {
            if (
                this.dependentFields.some((field) => prevProps.formValues[field] !== this.props.formValues[field])
            ) {
                this.props.onChange(this.initialValue); // resetting the value since dependent field changed
                this.updateCount++;
            }
        }
        componentDidMount() {
            if (this.props.previewOutput && this.props.value != null) {
                queryById(this.props.value).then((item) => {
                    this.setState({item});
                });
            }
        }
        render() {
            if (this.props.previewOutput && this.props.value != null) {
                if (this.state.item == null) { // loading
                    return null;
                } else {
                    return (
                        <div>{getLabel(this.state.item)}</div>
                    );
                }
            }

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
                        key={this.updateCount} // re-render component so it fetches new options
                        //  after dependentFields change

                        query={(searchString: string) => query(searchString, this.props)}
                        placeholder={getPlaceholder(this.props)}
                        getLabel={(item) => getLabel(item)}
                        onSelect={(item) => {
                            if (item == null) {
                                this.props.onChange(null);
                            } else {
                                this.props.onChange(item._id);
                            }
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

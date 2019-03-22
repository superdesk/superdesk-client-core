import React from 'react';
import classNames from 'classnames';
import {IInputType} from '../interfaces/input-types';

type ISelectSingleValueItems = Array<{id: string, label: string}>;

type IProps =  IInputType<string>;

interface IState {
    items: ISelectSingleValueItems;
}

export function getSelectSingleValue(getItems: (props: IProps) => Promise<ISelectSingleValueItems>) {
    return class SelectSingleValue extends React.Component<IProps, IState> {
        constructor(props) {
            super(props);

            this.state = {
                items: null,
            };
        }
        componentDidMount() {
            getItems(this.props)
                .then((items) => {
                    this.setState({items});
                });
        }
        render() {
            if (this.state.items == null) {
                return null;
            }

            if (this.props.previewOuput) {
                let item = this.state.items.find(({id}) => id === this.props.value);

                return item == null ? <div>{this.props.value}</div> : <div>{item.label}</div>;
            }

            return (
                <div className={classNames('sd-line-input', {'sd-line-input--invalid': this.props.issues.length > 0})}>
                    <label className="sd-line-input__label">{this.props.formField.label}</label>
                    <select
                        disabled={this.props.disabled}
                        value={this.props.value}
                        className="sd-line-input__select"
                        onChange={(event) => {
                            this.props.onChange(event.target.value);
                        }}
                    >
                        <option value="" />
                        {
                            this.state.items.map(({id, label}, i) => (
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

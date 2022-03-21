import React from 'react';
import {ITreeNode} from 'superdesk-api';
import {showPopup} from './popupNew';

interface IProps<T> {
    options: Array<ITreeNode<T>>;
    values: Array<T>;
    onChange(values: Array<T>): void;
    optionTemplate: React.ComponentType<{item: T}>;
    valueTemplate?: React.ComponentType<{item: T}>;
    getId(item: T): string;
    getLabel(item: T): string;
    readOnly?: boolean;
    required?: boolean;
}

export class MultiSelectTreeWithTemplate<T> extends React.PureComponent<IProps<T>> {
    render() {
        const {options, values, onChange, getId} = this.props;
        const OptionTemplate = this.props.optionTemplate;
        const ValueTemplate = this.props.valueTemplate ?? this.props.optionTemplate;

        return (
            <div>
                <button
                    onClick={(event) => {
                        showPopup(
                            event.target as HTMLElement,
                            'bottom-start',
                            ({closePopup}) => (
                                <div style={{background: 'white', padding: 10, border: '1px solid red'}}>
                                    {
                                        options.map((item, i) => (
                                            <div key={i}>
                                                <button
                                                    onClick={() => {
                                                        onChange(values.concat(item.value));
                                                        closePopup();
                                                    }}
                                                >
                                                    <OptionTemplate item={item.value} />
                                                </button>
                                            </div>
                                        ))
                                    }
                                </div>
                            ),
                            999,
                        );
                    }}
                >
                    +
                </button>

                {
                    values.map((item, i) => (
                        <span key={i}>
                            <ValueTemplate item={item} />
                            <button
                                onClick={() => {
                                    onChange(
                                        values.filter((_value) => getId(_value) !== getId(item)),
                                    );
                                }}
                            >
                                x
                            </button>
                        </span>
                    ))
                }
            </div>
        );
    }
}

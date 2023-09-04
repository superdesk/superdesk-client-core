import React from 'react';
import {TreeSelect} from 'superdesk-ui-framework/react';

interface IProps<T> {
    items: Array<T>;
    value: T;
    onChange(value: T): void;

    // used for filtering
    getLabel(item: T): string;

    required?: boolean;
    disabled?: boolean;
    zIndex?: number;

    'data-test-id'?: string;
}

export class SelectFilterable<T> extends React.PureComponent<IProps<T>> { // TODO: use tree select when fixed
    render() {
        const {items, value, getLabel, onChange, required, zIndex, disabled} = this.props;

        return (
            <select
                value={value == null ? '' : getLabel(value)}
                onChange={(event) => {
                    const label = event.target.value;

                    if (label === '') {
                        onChange(null);
                    } else {
                        onChange(items.find((item) => label === getLabel(item)));
                    }
                }}
                data-test-id={this.props['data-test-id']}
            >
                {
                    this.props.required !== true && (
                        <option value="" />
                    )
                }

                {
                    items.map((item, i) => (
                        <option value={getLabel(item)} key={i}>
                            {getLabel(item)}
                        </option>
                    ))
                }
            </select>
        );

        // return (
        //     <TreeSelect
        //         key={JSON.stringify(items)} // re-mount when items change
        //         inlineLabel
        //         labelHidden
        //         kind="synchronous"
        //         value={[value]}
        //         getOptions={() => items.map((item) => ({value: item}))}
        //         onChange={(val) => {
        //             onChange(val[0] ?? null);
        //         }}
        //         getLabel={getLabel}
        //         getId={getLabel}
        //         required={required}
        //         disabled={disabled}
        //         zIndex={zIndex}
        //         data-test-id={this.props['data-test-id']}
        //     />
        // );
    }
}

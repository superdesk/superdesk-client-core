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

export class SelectFilterable<T> extends React.PureComponent<IProps<T>> {
    render() {
        const {items, value, getLabel, onChange, required, zIndex, disabled} = this.props;

        return (
            <TreeSelect
                key={JSON.stringify(items)} // re-mount when items change
                inlineLabel
                labelHidden
                kind="synchronous"
                value={[value]}
                getOptions={() => items.map((item) => ({value: item}))}
                onChange={(val) => {
                    onChange(val[0] ?? null);
                }}
                getLabel={getLabel}
                getId={getLabel}
                required={required}
                disabled={disabled}
                zIndex={zIndex}
                data-test-id={this.props['data-test-id']}
            />
        );
    }
}

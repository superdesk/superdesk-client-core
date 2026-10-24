import React from 'react';
import {TreeSelect} from 'superdesk-ui-framework/react';

interface IProps<T> {
    items: Array<T>;
    value: T;
    onChange(value: T): void;

    // used for filtering
    getLabel(item: T): string;

    // accessible name of the control; it is not displayed
    label?: string;

    required?: boolean;
    disabled?: boolean;

    'data-test-id'?: string;
}

export class SelectFilterable<T> extends React.PureComponent<IProps<T>> {
    private wrapper = React.createRef<HTMLDivElement>();

    componentDidMount() {
        this.nameTrigger();
    }

    componentDidUpdate() {
        this.nameTrigger();
    }

    /**
     * The single-value `TreeSelect` opens through an empty overlay button that the framework leaves
     * unnamed and does not link to its label, so screen readers announce a nameless "button".
     */
    private nameTrigger() {
        const trigger = this.wrapper.current?.querySelector('.tags-input__overlay-button');

        if (trigger == null || this.props.label == null) {
            return;
        }

        const {value, getLabel, label} = this.props;

        trigger.setAttribute('aria-label', value == null ? label : `${label}: ${getLabel(value)}`);
        trigger.setAttribute('aria-haspopup', 'tree');
    }

    render() {
        const {items, value, getLabel, onChange, required, disabled, label} = this.props;

        return (
            <div ref={this.wrapper} style={{display: 'contents'}}>
                <TreeSelect
                    key={JSON.stringify(items)} // re-mount when items change
                    inlineLabel
                    labelHidden
                    label={label}
                    kind="synchronous"
                    value={value !== null ? [value] : null}
                    getOptions={() => items.map((item) => ({value: item}))}
                    onChange={(val) => {
                        onChange(val[0] ?? null);
                    }}
                    getLabel={getLabel}
                    getId={getLabel}
                    required={required}
                    disabled={disabled}
                    data-test-id={this.props['data-test-id']}
                    inputWidth="100%"
                />
            </div>
        );
    }
}

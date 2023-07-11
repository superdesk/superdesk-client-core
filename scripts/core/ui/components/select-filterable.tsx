import React from 'react';
import {SelectWithTemplate} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';

interface IProps<T> {
    items: Array<T>;
    value: T;
    onChange(value: T): void;
    getLabel(item: T): string;
    required?: boolean;
    disabled?: boolean;
    itemTemplate?: React.ComponentType<{option: T | null}>;
    zIndex?: number;
}

export class SelectFilterable<T> extends React.PureComponent<IProps<T>> {
    render() {
        const {items, value, getLabel, required} = this.props;

        const defaultTemplate = ({option}) => (
            <div>{getLabel(option)}</div>
        );

        return (
            <SelectWithTemplate
                label=""
                inlineLabel
                labelHidden
                key={JSON.stringify(items)} // re-mount when items change
                getItems={(searchString) => searchString === null
                    ? Promise.resolve(items)
                    : Promise.resolve(
                        items.filter(
                            (item) => getLabel(item).toLocaleLowerCase().includes(searchString.toLocaleLowerCase()),
                        ),
                    )
                }
                getLabel={getLabel}
                value={value}
                areEqual={(a, b) => getLabel(a) === getLabel(b)}
                itemTemplate={this.props.itemTemplate ?? defaultTemplate}
                noResultsFoundMessage={gettext('No results found')}
                onChange={(item) => {
                    this.props.onChange(item);
                }}
                disabled={this.props.disabled}
                width="100%"
                required={required}
                zIndex={this.props.zIndex}
            />
        );
    }
}

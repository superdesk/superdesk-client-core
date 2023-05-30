import React from 'react';
import {SelectWithTemplate} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {IPropsFilterable} from './select-filterable';

export class SelectFilterableNoLabels<T> extends React.PureComponent<IPropsFilterable<T>> {
    render() {
        const {items, value, getLabel, required} = this.props;

        const defaultTemplate = ({option}) => (
            <div>{getLabel(option)}</div>
        );

        return (
            <SelectWithTemplate
                fullWidth
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
                required={required}
                zIndex={this.props.zIndex}
            />
        );
    }
}

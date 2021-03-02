import React from 'react';
import {IArticle} from 'superdesk-api';
import {IMultiSelectOptions} from './MultiSelectHoc';
import {SelectBoxWithoutMutation} from 'apps/search/components/SelectBox';
import {TypeIcon} from 'apps/search/components';

/**
 * This component is meant to work with IMultiSelectNew interface.
 * Multi-selection in angular based lists works differently and uses ILegacyMultiSelect interface.
 */
export class MultiSelect extends React.Component<{item: IArticle; options: IMultiSelectOptions}> {
    render() {
        const {item, options} = this.props;

        const checkbox = (
            <SelectBoxWithoutMutation
                item={item}
                onSelect={(selected: boolean, multiSelectMode: boolean) => {
                    if (multiSelectMode) {
                        options.select(item, true);
                    } else {
                        options.toggle(item);
                    }
                }}
                selected={options.selected.has(item._id)}
                className="hover-AB--B"
                data-test-id="multi-select-checkbox"
            />
        );

        return (
            <div
                className="list-field type-icon"
                data-test-id="item-type-and-multi-select"
            >
                {
                    options.selected.has(item._id)
                        ? checkbox
                        : (
                            <div className="hover-AB">
                                <div className="hover-AB--A" style={{display: 'flex'}}>
                                    <TypeIcon
                                        type={item.type}
                                        highlight={item.highlight}
                                    />
                                </div>
                                {checkbox}
                            </div>
                        )
                }
            </div>
        );
    }
}

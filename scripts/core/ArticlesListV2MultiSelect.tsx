import React from 'react';
import {IArticle} from 'superdesk-api';
import {IMultiSelectOptions} from './MultiSelectHoc';
import {SelectBoxWithoutMutation} from 'apps/search/components/SelectBox';
import {TypeIcon} from 'apps/search/components';
import {OrderedMap} from 'immutable';
import {generateTrackByIdentifier} from 'apps/search/services/SearchService';

interface IProps {
    item: IArticle;
    allItems: OrderedMap<string, IArticle>;
    options: IMultiSelectOptions<IArticle>;
}

/**
 * This component is meant to work with IMultiSelectNew interface.
 * Multi-selection in angular based lists works differently and uses ILegacyMultiSelect interface.
 */
export class MultiSelect extends React.Component<IProps> {
    render() {
        const {item, allItems, options} = this.props;

        const checkbox = (
            <SelectBoxWithoutMutation
                item={item}
                onSelect={(selected: boolean, multiSelectMode: boolean) => {
                    if (multiSelectMode) {
                        const lastMultiselected = options.selected.last();
                        const itemsSeq = allItems.valueSeq();

                        const lastSelectedIndex = itemsSeq.indexOf(lastMultiselected);
                        const currentIndex = itemsSeq.indexOf(item);

                        const from = Math.min(lastSelectedIndex, currentIndex);
                        const to = Math.max(lastSelectedIndex, currentIndex) + 1;

                        options.selectMultiple(
                            allItems.slice(from, to).toOrderedMap(),
                        );
                    } else {
                        options.toggle(item);
                    }
                }}
                selected={options.selected.has(generateTrackByIdentifier(item))}
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
                    options.selected.has(generateTrackByIdentifier(item))
                        ? checkbox
                        : (
                            <div className="hover-AB">
                                <div className="hover-AB--A" style={{display: 'flex'}}>
                                    <TypeIcon
                                        type={item.type}
                                        highlight={item.highlight}
                                        contentProfileId={item.profile}
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

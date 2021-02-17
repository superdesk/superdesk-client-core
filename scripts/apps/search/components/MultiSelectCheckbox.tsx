import {assertNever} from 'core/helpers/typescript-helpers';
import React from 'react';
import {IArticle} from 'superdesk-api';
import {ListTypeIcon} from '.';
import {ILegacyMultiSelect, IMultiSelectNew} from './ItemList';

interface IProps {
    item: IArticle;
    itemSelected: boolean;
    multiSelect: IMultiSelectNew | ILegacyMultiSelect;
}

export class MultiSelectCheckbox extends React.PureComponent<IProps> {
    render() {
        const {multiSelect, item, itemSelected} = this.props;

        if (multiSelect.kind === 'legacy') {
            return (
                <ListTypeIcon
                    item={item}
                    itemSelected={itemSelected}
                    onMultiSelect={multiSelect.multiSelect}
                />

            );
        } else if (multiSelect.kind === 'new') {
            const {MultiSelectComponent} = multiSelect;

            return (
                <MultiSelectComponent
                    item={item}
                    options={multiSelect.options}
                />
            );
        } else {
            assertNever(multiSelect);
        }
    }
}

import * as React from 'react';
import {Set, OrderedMap} from 'immutable';
import {ISuperdesk} from 'superdesk-api';
import {ITagUi} from './types';
import {Tag} from 'superdesk-ui-framework/react';
import {noop} from 'lodash';
import {TagPopover} from './tag-popover';

interface IProps {
    readOnly: boolean;
    savedTags: Set<string>;
    tags: OrderedMap<string, ITagUi>;
    onRemove(id: string): void;
}

export function getTagsListComponent(superdesk: ISuperdesk): React.ComponentType<IProps> {
    const {gettext} = superdesk.localization;

    return class TagList extends React.PureComponent<IProps> {
        render() {
            const {tags, onRemove, readOnly, savedTags} = this.props;

            const groupedByParent = tags.groupBy((tag) => tag.parent);

            // Remove child items from root array
            const filteredTags = tags.filter((tag) => !tag.parent);

            const tagListItem = (item: ITagUi, id?: string, parent = false) => (
                <TagPopover
                    tag={item}
                    key={item.qcode}
                    gettext={gettext}
                >
                    <Tag
                        key={item.qcode}
                        text={item.name}
                        shade={savedTags.has(item.qcode) ?
                            (parent ? 'highlight2' : 'highlight1') :
                            (parent ? 'darker' : 'light')}
                        onClick={
                            readOnly
                                ? noop
                                : () => {
                                    onRemove(id || item.qcode);
                                }
                        }
                    />
                </TagPopover>
            );

            return filteredTags.map((item, id) => (
                <React.Fragment key={id}>
                    {tagListItem(item, id, !!groupedByParent.get(id))}
                    {groupedByParent.get(id) ? groupedByParent.get(id).map((tag) => tagListItem(tag)).toArray() : null}
                    {groupedByParent.get(id) ? <br /> : ''}
                </React.Fragment>
            )).toArray();
        }
    };
}

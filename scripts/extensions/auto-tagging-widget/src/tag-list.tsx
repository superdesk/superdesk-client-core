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
            const rootTags = tags.filter((tag) => tag.parent == null);

            const tagListItem = (item: ITagUi, id?: string, isParent: boolean = false) => (
                <TagPopover
                    tag={item}
                    key={item.qcode}
                    gettext={gettext}
                >
                    <Tag
                        key={item.qcode}
                        text={item.name}
                        shade={savedTags.has(item.qcode) ?
                            (isParent ? 'highlight2' : 'highlight1') :
                            (isParent ? 'darker' : 'light')}
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

            return rootTags.map((item, id) => {
                const childrenTags = groupedByParent.get(id);

                return (
                    <React.Fragment key={id}>
                        {
                            tagListItem(item, id, childrenTags != null)
                        }

                        {
                            childrenTags != null && (
                                <React.Fragment>
                                    {
                                        childrenTags.map((tag) => tagListItem(tag)).toArray()
                                    }
                                    <br />
                                </React.Fragment>
                            )
                        }
                    </React.Fragment>
                );
            }).toArray();
        }
    };
}

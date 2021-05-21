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

            return tags.map((item, id) => (
                <TagPopover
                    tag={item}
                    key={item.qcode}
                    gettext={gettext}
                >
                    <Tag
                        key={item.qcode}
                        text={item.name}
                        shade={savedTags.has(item.qcode) ? 'highlight1' : 'light'}
                        onClick={
                            readOnly
                                ? noop
                                : () => {
                                    onRemove(id);
                                }
                        }
                    />
                </TagPopover>
            )).toArray();
        }
    };
}

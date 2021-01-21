import * as React from 'react';
import {Set, OrderedMap} from 'immutable';
import {ISuperdesk} from 'superdesk-api';
import {ITagUi} from './types';
import {Tag} from 'superdesk-ui-framework/react';
import {noop} from 'lodash';

interface IProps {
    readOnly: boolean;
    savedTags: Set<string>;
    tags: OrderedMap<string, ITagUi>;
    onRemove(id: string): void;
}

export function getTagsListComponent(_: ISuperdesk): React.ComponentType<IProps> {
    return class TagList extends React.PureComponent<IProps> {
        render() {
            const {tags, onRemove, readOnly, savedTags} = this.props;

            return tags.map((item, id) => (
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
            )).toArray();
        }
    };
}

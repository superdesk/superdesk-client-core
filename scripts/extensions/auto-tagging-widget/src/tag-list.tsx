import * as React from 'react';
import {OrderedMap} from 'immutable';
import {ISuperdesk} from 'superdesk-api';
import {ITagUi} from './types';
import {Tag} from 'superdesk-ui-framework/react';

interface IProps {
    tags: OrderedMap<string, ITagUi>;
    onRemove(id: string): void;
}

export function getTagsListComponent(_: ISuperdesk): React.ComponentType<IProps> {
    return class TagList extends React.PureComponent<IProps> {
        render() {
            const {tags, onRemove} = this.props;

            return tags.map((item, id) => (
                <Tag
                    key={item.qcode}
                    text={item.name}
                    shade={item.saved ? 'highlight1' : 'light'}
                    onClick={() => {
                        onRemove(id);
                    }}
                />
            )).toArray();
        }
    };
}

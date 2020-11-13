// @ts-nocheck

import * as React from 'react';
import {OrderedMap} from 'immutable';
import {ISuperdesk} from 'superdesk-api';
import {ITagUi} from './types';
import {Tag} from 'superdesk-ui-framework/react';

interface IProps {
    readOnly: boolean;
    tags: OrderedMap<string, ITagUi>;
    onRemove(id: string): void;
}

export function getTagsListComponent(_: ISuperdesk): React.ComponentType<IProps> {
    return class TagList extends React.PureComponent<IProps> {
        render() {
            const {tags, onRemove, readOnly} = this.props;

            return tags.map((item, id) => (
                <Tag
                    key={item.qcode}
                    text={item.name}
                    shade={item.saved ? 'highlight1' : 'light'}
                    onClick={
                        readOnly
                            ? undefined
                            : () => {
                                onRemove(id);
                            }
                    }
                />
            )).toArray();
        }
    };
}

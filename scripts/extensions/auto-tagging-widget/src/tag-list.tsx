import * as React from 'react';
import {OrderedMap} from 'immutable';
import {ISuperdesk} from 'superdesk-api';
import {ITagUi} from './types';

interface IProps {
    tags: OrderedMap<string, ITagUi>;
    onRemove(id: string): void;
}

export function getTagsListComponent(superdesk: ISuperdesk): React.ComponentType<IProps> {
    const {gettext} = superdesk.localization;

    return class TagList extends React.PureComponent<IProps> {
        render() {
            const {tags, onRemove} = this.props;

            return tags.map((item, id) => {
                if (item == null || id == null) {
                    throw new Error('Can not be nullish.');
                }

                return (
                    <div key={item.qcode} className="tag-label">
                        {item.name}
                        <button
                            className="tag-label__remove"
                            onClick={() => {
                                onRemove(id);
                            }}
                            aria-label={gettext('Remove')}
                        >
                            <i className="icon-close-small" />
                        </button>
                    </div>
                );
            }).toArray();
        }
    };
}

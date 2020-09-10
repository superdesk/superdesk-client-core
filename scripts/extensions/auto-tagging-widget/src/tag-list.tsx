import * as React from 'react';
import { ITag } from './auto-tagging';
import { ISuperdesk } from 'superdesk-api';

interface IProps {
    tags: Array<ITag>;
    onChange(tags: Array<ITag>): void;
}

export function getTagsListComponent(superdesk: ISuperdesk): React.ComponentType<IProps> {
    const { gettext } = superdesk.localization;

    return class TagList extends React.PureComponent<IProps> {
        render() {
            const { tags, onChange } = this.props;

            return (tags.map((item: ITag) => {
                return (
                    <li key={item.uuid} className="tag-label">
                        {item.title}
                        <button className="tag-label__remove"
                            onClick={() => {
                                onChange(
                                    tags.filter(({ uuid }) => uuid !== item.uuid),
                                );
                            }}
                            aria-label={gettext('Remove')}>
                            <i className="icon-close-small" />
                        </button>
                    </li>
                );
            })
            );
        }
    };
}

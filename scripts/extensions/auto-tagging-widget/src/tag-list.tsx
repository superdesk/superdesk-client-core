import * as React from 'react';
import {Set, OrderedMap} from 'immutable';
import {ISuperdesk, ITreeNode} from 'superdesk-api';
import {ITagUi} from './types';
import {Tag} from 'superdesk-ui-framework/react';
import {noop} from 'lodash';
import {TagPopover} from './tag-popover';

interface IProps {
    readOnly: boolean;
    savedTags: Set<string>;
    tags: OrderedMap<string, ITagUi>;
    onRemove(id: Array<string>): void;
}

export function getTagsListComponent(superdesk: ISuperdesk): React.ComponentType<IProps> {
    const {gettext} = superdesk.localization;
    const {arrayToTree, treeToArray} = superdesk.utilities;

    return class TagList extends React.PureComponent<IProps> {
        render() {
            const {tags, onRemove, readOnly, savedTags} = this.props;
            const tagsJs: Array<ITagUi> = Object.values(tags.toJS());

            const tagsTree = arrayToTree(
                tagsJs,
                (item) => item.qcode,
                (item) => item.parent,
            );

            const tagListItem = (node: ITreeNode<ITagUi>) => {
                const isRootNodeWithChildren = node.parent == null && node.children != null;
                const item = node.value;

                return (
                    <TagPopover
                        tag={item}
                        key={item.qcode}
                        gettext={gettext}
                    >
                        <Tag
                            key={item.qcode}
                            text={item.name}
                            shade={savedTags.has(item.qcode) ?
                                (isRootNodeWithChildren ? 'highlight2' : 'highlight1') :
                                (isRootNodeWithChildren ? 'darker' : 'light')}
                            onClick={
                                readOnly
                                    ? noop
                                    : () => {
                                        onRemove(
                                            treeToArray([node]).map(({qcode}) => qcode),
                                        );
                                    }
                            }
                        />
                    </TagPopover>
                );
            };

            function renderTreeNode(treeNodes: Array<ITreeNode<ITagUi>>, level: number = 0): JSX.Element {
                return (
                    <div style={{paddingLeft: level === 0 ? 0 : 14}}>
                        {
                            treeNodes.map((node) => (
                                <React.Fragment key={node.value.qcode}>
                                    {
                                        tagListItem(node)
                                    }

                                    {
                                        node.children != null && renderTreeNode(node.children, level + 1)
                                    }
                                </React.Fragment>
                            ))
                        }
                    </div>
                );
            }

            return renderTreeNode(tagsTree);
        }
    };
}

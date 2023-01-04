/* eslint-disable react/no-multi-comp */
import React from 'react';
import {IconButton} from 'superdesk-ui-framework/react';
import {
    IArticle,
    IEditorComponentProps,
    IPackageItemsConfig,
    IPackageItemsUserPreferences,
    IPackageItemsValueOperational,
} from 'superdesk-api';
import {Spacer} from 'core/ui/components/Spacer';
import {getDroppedItem, gettext} from 'core/utils';
import {DropZone3} from 'core/ui/components/drop-zone-3';
import {ArticleItemConcise} from 'core/ui/components/article-item-concise';
import {openArticle} from 'core/get-superdesk-api-implementation';
import {DragHandle} from 'core/ui/components/drag-handle';
import {arrayMove, WithSortable} from '@superdesk/common';
import {WithArticles} from 'core/with-articles';

type IProps = IEditorComponentProps<IPackageItemsValueOperational, IPackageItemsConfig, IPackageItemsUserPreferences>;

function getItemTemplate(that: Editor) {
    return class SortableItemComponent extends React.PureComponent<{item: IArticle}> {
        render() {
            const {item} = this.props;
            const {readOnly} = that.props;
            const {removeItem} = that;

            return (
                <Spacer h gap="8" noWrap alignItems="center">
                    {
                        !readOnly && (
                            <div>
                                <DragHandle />
                            </div>
                        )
                    }

                    <div style={{flexGrow: 1}}>
                        <ArticleItemConcise
                            article={item}
                            actionsMenu={[
                                {
                                    label: gettext('Edit'),
                                    onClick: () => {
                                        openArticle(item._id, 'edit');
                                    },
                                },
                                {
                                    label: gettext('Edit in new window'),
                                    onClick: () => {
                                        openArticle(item._id, 'edit-new-window');
                                    },
                                },
                            ]}
                        />
                    </div>

                    {
                        !readOnly && (
                            <div>
                                <IconButton
                                    icon="remove-sign"
                                    ariaValue={gettext('Remove')}
                                    onClick={() => {
                                        removeItem(item._id);
                                    }}
                                />
                            </div>
                        )
                    }
                </Spacer>
            );
        }
    };
}

export class Editor extends React.PureComponent<IProps> {
    private itemTemplate: ReturnType<typeof getItemTemplate>;

    constructor(props: IProps) {
        super(props);

        this.itemTemplate = getItemTemplate(this);
        this.removeItem = this.removeItem.bind(this);
    }

    removeItem(idToRemove: IArticle['_id']) {
        const linkedItems = this.props.value ?? [];

        this.props.onChange(
            linkedItems.filter(({guid}) => guid !== idToRemove),
        );
    }

    render() {
        const Container = this.props.container;
        const packageItems = (this.props.value ?? []);
        const packageItemIds = packageItems.map(({guid}) => guid);
        const {readOnly} = this.props;

        return (
            <Container>
                <DropZone3
                    canDrop={() => !readOnly}
                    onDrop={(event) => {
                        const item = getDroppedItem(event);

                        if (item != null) {
                            this.props.onChange(packageItems.concat(
                                {
                                    guid: item.guid,
                                    type: item.type,
                                    headline: item.headline,
                                    residRef: item.guid,
                                    location: 'archive',
                                    slugline: item.slugline,
                                    renditions: {},
                                    itemClass: item.type ? 'icls:' + item.type : '',
                                },
                            ));
                        }
                    }}
                >
                    {
                        packageItemIds.length > 0 && (
                            <WithArticles ids={packageItemIds}>
                                {
                                    (items) => (
                                        <WithSortable
                                            items={items}
                                            itemTemplate={this.itemTemplate}
                                            getId={(item) => item._id}
                                            options={{
                                                shouldCancelStart: () => readOnly,
                                                onSortEnd: ({oldIndex, newIndex}) => {
                                                    this.props.onChange(arrayMove(packageItems, oldIndex, newIndex));
                                                },
                                                distance: 10,
                                                helperClass: 'dragging-in-progress',
                                            }}
                                        />
                                    )
                                }
                            </WithArticles>
                        )
                    }
                </DropZone3>
            </Container>
        );
    }
}

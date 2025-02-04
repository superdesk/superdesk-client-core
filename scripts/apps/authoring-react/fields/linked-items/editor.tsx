/* eslint-disable react/no-multi-comp */
import React from 'react';
import {IconButton} from 'superdesk-ui-framework/react';
import {
    IArticle,
    IEditorComponentProps,
    ILinkedItemsValueOperational,
    ILinkedItemsConfig,
    ILinkedItemsUserPreferences,
} from 'superdesk-api';
import {Spacer} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';
import {DropZone3} from 'core/ui/components/drop-zone-3';
import {ArticleItemConcise} from 'core/ui/components/article-item-concise';
import {openArticle, applicationState} from 'core/get-superdesk-api-implementation';
import {DragHandle} from 'core/ui/components/drag-handle';
import {arrayMove, WithSortable} from '@superdesk/common';
import {WithArticles} from 'core/with-articles';
import {ContentCreateDropdown} from 'core/ui/components/content-create-dropdown/content-create-dropdown';
import {RelatedItemCreateNewButton} from 'apps/relations/directives/related-items-create-new-button';
import {sdApi} from 'api';
import {getDroppedItem} from 'utils/dragging';

type IProps = IEditorComponentProps<ILinkedItemsValueOperational, ILinkedItemsConfig, ILinkedItemsUserPreferences>;

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
            linkedItems.filter(({id}) => id !== idToRemove),
        );
    }

    render() {
        const Container = this.props.container;
        const linkedItems = (this.props.value ?? []);
        const linkedItemIds = linkedItems.map(({id}) => id);
        const {readOnly} = this.props;

        const miniToolbar = readOnly
            ? undefined
            : (
                <ContentCreateDropdown
                    customButton={RelatedItemCreateNewButton}
                    onCreate={(articles) => {
                        this.props.onChange(linkedItems.concat(articles.map(({_id, type}) => ({id: _id, type}))));

                        const createdTextItem = articles.find(({type}) => type === 'text');

                        if (createdTextItem != null && applicationState.articleInEditMode != null) {
                            sdApi.localStorage.setItem(
                                `open-item-after-related-closed--${createdTextItem._id}`,
                                applicationState.articleInEditMode,
                            );
                        }
                    }}
                />
            );

        return (
            <Container miniToolbar={miniToolbar}>
                <DropZone3
                    canDrop={() => !readOnly}
                    onDrop={(event) => {
                        const item = getDroppedItem(event);

                        if (item != null) {
                            this.props.onChange(linkedItems.concat({id: item._id, type: item.type}));
                        }
                    }}
                >
                    {
                        linkedItemIds.length > 0 && (
                            <WithArticles ids={linkedItemIds}>
                                {(items) => (
                                    <WithSortable
                                        items={items}
                                        itemTemplate={this.itemTemplate}
                                        getId={(item) => item._id}
                                        options={{
                                            shouldCancelStart: () => readOnly,
                                            onSortEnd: ({oldIndex, newIndex}) => {
                                                this.props.onChange(arrayMove(linkedItems, oldIndex, newIndex));
                                            },
                                            distance: 10,
                                            helperClass: 'dragging-in-progress',
                                        }}
                                    />
                                )}
                            </WithArticles>
                        )
                    }
                </DropZone3>
            </Container>
        );
    }
}

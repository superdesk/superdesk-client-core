import React from 'react';
import {DragDropContext, DropResult} from '@hello-pangea/dnd';
import {
    IArticle,
    IEditorComponentProps,
    IPackageGroup,
    IPackageItemsConfig,
    IPackageItemsUserPreferences,
    IPackageItemsValueOperational,
} from 'superdesk-api';
import {gettext} from 'core/utils';
import {notify} from 'core/notify/notify';
import {addInternalEventListener} from 'core/internal-events';
import {PackageGroupItems} from './package-group-items';
import {PackageGroupTitle} from './package-group-title';
import {HighlightPreview} from './highlight-preview';
import {addItemsToGroup, moveItem, removeItem, setItemLabel} from './package-groups';
import {removeOpenPackageGroups, setOpenPackageGroups} from './open-packages';

type IProps = IEditorComponentProps<IPackageItemsValueOperational, IPackageItemsConfig, IPackageItemsUserPreferences>;

export class Editor extends React.PureComponent<IProps> {
    private removeListeners: Array<() => void> = [];

    constructor(props: IProps) {
        super(props);

        this.addItems = this.addItems.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
    }

    private getGroups(): IPackageItemsValueOperational {
        return this.props.value ?? [];
    }

    private getPackageId(): IArticle['_id'] {
        return (this.props.item as IArticle)._id;
    }

    addItems(groupId: IPackageGroup['id'], items: Array<IArticle>) {
        const {groups, duplicates} = addItemsToGroup(this.getGroups(), groupId, items);

        if (duplicates.length > 0) {
            notify.error(gettext('Item is already in this package.'));
        }

        if (groups !== this.getGroups()) {
            this.props.onChange(groups);
        }
    }

    onDragEnd(result: DropResult) {
        if (result.destination == null) {
            return;
        }

        this.props.onChange(moveItem(
            this.getGroups(),
            {groupId: result.source.droppableId, index: result.source.index},
            {groupId: result.destination.droppableId, index: result.destination.index},
        ));
    }

    componentDidMount() {
        setOpenPackageGroups(this.getPackageId(), this.getGroups());

        this.removeListeners.push(
            addInternalEventListener('addItemsToPackageInAuthoringReact', (event) => {
                const {packageId, groupId, items} = event.detail;

                if (packageId === this.getPackageId() && !this.props.readOnly) {
                    this.addItems(groupId, items);
                }
            }),
            addInternalEventListener('setPackageItemLabelInAuthoringReact', (event) => {
                const {packageId, itemId, label} = event.detail;

                if (packageId === this.getPackageId() && !this.props.readOnly) {
                    this.props.onChange(setItemLabel(this.getGroups(), itemId, label));
                }
            }),
        );
    }

    componentDidUpdate() {
        setOpenPackageGroups(this.getPackageId(), this.getGroups());
    }

    componentWillUnmount() {
        removeOpenPackageGroups(this.getPackageId());
        this.removeListeners.forEach((removeListener) => removeListener());
    }

    render() {
        const Container = this.props.container;
        const {readOnly} = this.props;
        const groups = this.getGroups();
        const item = this.props.item as IArticle;

        return (
            <Container>
                <DragDropContext onDragEnd={this.onDragEnd}>
                    {
                        groups.map((group) => (
                            <div
                                key={group.id}
                                data-test-id="package-group"
                                data-test-value={group.id}
                                style={{marginBottom: 16}}
                            >
                                <PackageGroupTitle label={group.label || group.id} />

                                <PackageGroupItems
                                    group={group}
                                    readOnly={readOnly}
                                    onDropItem={(droppedItem) => this.addItems(group.id, [droppedItem])}
                                    onRemove={(residRef) => {
                                        this.props.onChange(removeItem(groups, group.id, residRef));
                                    }}
                                    onLabelChange={(residRef, label) => {
                                        this.props.onChange(setItemLabel(groups, residRef, label));
                                    }}
                                />
                            </div>
                        ))
                    }
                </DragDropContext>

                {
                    item.highlight != null && (
                        <HighlightPreview packageId={item._id} />
                    )
                }
            </Container>
        );
    }
}

import React from 'react';
import {Draggable, Droppable} from '@hello-pangea/dnd';
import {IArticle, IPackageGroup, IPackageItem} from 'superdesk-api';
import {gettext} from 'core/utils';
import {DropZone3} from 'core/ui/components/drop-zone-3';
import {DragHandle} from 'core/ui/components/drag-handle';
import {getDroppedItem} from 'utils/dragging';
import {PackageItemCard} from './package-item-card';

interface IProps {
    group: IPackageGroup;
    readOnly: boolean;
    onDropItem(item: IArticle): void;
    onRemove(residRef: IPackageItem['residRef']): void;
    onLabelChange(residRef: IPackageItem['residRef'], label: string | null): void;
}

export class PackageGroupItems extends React.PureComponent<IProps> {
    render() {
        const {group, readOnly} = this.props;

        return (
            <DropZone3
                canDrop={() => !readOnly}
                onDrop={(event) => {
                    const droppedItem = getDroppedItem(event);

                    if (droppedItem != null) {
                        this.props.onDropItem(droppedItem);
                    }
                }}
            >
                <Droppable droppableId={group.id} isDropDisabled={readOnly}>
                    {(droppableProvided) => (
                        <div
                            ref={droppableProvided.innerRef}
                            {...droppableProvided.droppableProps}
                            style={{minHeight: 40}}
                        >
                            {group.refs.map((ref, index) => (
                                <Draggable
                                    key={ref.residRef}
                                    draggableId={ref.residRef}
                                    index={index}
                                    isDragDisabled={readOnly}
                                >
                                    {(draggableProvided) => (
                                        <div
                                            ref={draggableProvided.innerRef}
                                            {...draggableProvided.draggableProps}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                ...draggableProvided.draggableProps.style,
                                            }}
                                        >
                                            {
                                                !readOnly && (
                                                    <div
                                                        {...draggableProvided.dragHandleProps}
                                                        data-test-id="package-item-drag-handle"
                                                    >
                                                        <DragHandle />
                                                    </div>
                                                )
                                            }

                                            <PackageItemCard
                                                packageItem={ref}
                                                readOnly={readOnly}
                                                onRemove={() => this.props.onRemove(ref.residRef)}
                                                onLabelChange={(label) => this.props.onLabelChange(ref.residRef, label)}
                                            />
                                        </div>
                                    )}
                                </Draggable>
                            ))}

                            {droppableProvided.placeholder}

                            {
                                group.refs.length < 1 && (
                                    <div
                                        style={{padding: 10, textAlign: 'center', opacity: 0.4}}
                                        data-test-id="package-group-empty"
                                    >
                                        {readOnly ? gettext('No items') : gettext('Drop items here')}
                                    </div>
                                )
                            }
                        </div>
                    )}
                </Droppable>
            </DropZone3>
        );
    }
}

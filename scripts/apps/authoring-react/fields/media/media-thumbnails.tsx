/* eslint-disable react/no-multi-comp */
import {arrayMove} from 'core/utils';
import React from 'react';
import {SortableContainer, SortableElement} from 'react-sortable-hoc';
import {IArticle} from 'superdesk-api';

interface IProps {
    mediaItems: Array<IArticle>;
    onSelect(mediaItem: IArticle): void;
    onChange?(mediaItems: Array<IArticle>): void;
}

interface IPropsSortableItem {
    item: IArticle;
    onSelect: IProps['onSelect'];
}

interface IPropsSortableContainer {
    mediaItems: IProps['mediaItems'];
    onSelect: IProps['onSelect'];
}

const SortableItem = SortableElement(
    class SortableItemComponent extends React.PureComponent<IPropsSortableItem> {
        render() {
            const {item, onSelect} = this.props;

            return (
                <div>
                    <button
                        className="sd-media-carousel__thumb sd-focusable"
                        onClick={() => {
                            onSelect(item);
                        }}
                    >
                        {(() => {
                            if (item.type === 'picture') {
                                return (
                                    <img src={item.renditions.thumbnail.href} draggable={false} />
                                );
                            } else if (item.type === 'video') {
                                if (item.renditions?.thumbnail != null) {
                                    return (
                                        <img src={item.renditions.thumbnail.href} draggable={false} />
                                    );
                                } else {
                                    return (
                                        <i className="icon--2x icon-video" />
                                    );
                                }
                            } else if (item.type === 'audio') {
                                return (
                                    <i className="icon--2x icon-audio" />
                                );
                            }
                        })()}
                    </button>
                </div>
            );
        }
    },
);

const SortableList = SortableContainer(
    class SortableListComponent extends React.PureComponent<IPropsSortableContainer> {
        render() {
            const {mediaItems, onSelect} = this.props;

            return (
                <div className="sd-media-carousel__thumb-strip" style={{margin: 0}}>
                    {
                        mediaItems.map((item, i) => (
                            <SortableItem key={item._id} index={i} item={item} onSelect={onSelect} />
                        ))
                    }
                </div>
            );
        }
    },
);

export class MediaThumbnails extends React.PureComponent<IProps> {
    render() {
        const {mediaItems} = this.props;

        return (
            <SortableList
                mediaItems={mediaItems}
                onSelect={this.props.onSelect}
                onSortEnd={({oldIndex, newIndex}) => {
                    this.props.onChange(arrayMove(mediaItems, oldIndex, newIndex));
                }}
                axis="x"
                helperClass="field--media--carousel-sortable-item"
                distance={10} // ensure that clicking doesn't initialize dragging
            />
        );
    }
}

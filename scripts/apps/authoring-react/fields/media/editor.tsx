import React from 'react';
import {IArticle, IEditorComponentProps} from 'superdesk-api';
import ng from 'core/services/ng';
import {getSuperdeskType, gettext} from 'core/utils';
import {IMediaValueOperational, IMediaConfig, IMediaUserPreferences} from './interfaces';
import {DropZone3} from 'core/ui/components/drop-zone-3';
import {MediaCarousel} from './media-carousel/media-carousel';
import {SpacerBlock} from 'core/ui/components/Spacer';
import {MediaThumbnails} from './media-thumbnails';
import {SUPERDESK_MEDIA_TYPES} from 'core/constants';
import {notify} from 'core/notify/notify';
import {maxItemsDefault} from './constants';
import {validateWorkflow} from 'apps/relations/services/RelationsService';

type IProps = IEditorComponentProps<IMediaValueOperational, IMediaConfig, IMediaUserPreferences>;

export class Editor extends React.PureComponent<IProps> {
    private mediaCarouselRef: MediaCarousel;

    constructor(props: IProps) {
        super(props);

        this.state = {
            previewEnabled: false,
        };

        this.getMediaItems = this.getMediaItems.bind(this);
        this.getAllowedMimeTypes = this.getAllowedMimeTypes.bind(this);
        this.getMaxRemainingItemsCount = this.getMaxRemainingItemsCount.bind(this);
        this.isMediaTypeAllowed = this.isMediaTypeAllowed.bind(this);
        this.upload = this.upload.bind(this);
        this.handleDragDrop = this.handleDragDrop.bind(this);
    }

    private getMediaItems(): IMediaValueOperational {
        return this.props.value ?? [];
    }

    private getAllowedMimeTypes(): string {
        const {config} = this.props;

        const acceptFileTypes = [];

        if (config.allowPicture) {
            acceptFileTypes.push('image/*');
        }

        if (config.allowAudio) {
            acceptFileTypes.push('audio/*');
        }

        if (config.allowVideo) {
            acceptFileTypes.push('video/*');
        }

        return acceptFileTypes.join(',');
    }

    private getMaxRemainingItemsCount(): number | undefined {
        const {config} = this.props;

        if (config.maxItems == null) {
            return undefined;
        }

        const mediaItems = this.getMediaItems();
        const maxUploadsRemaining = config.maxItems - mediaItems.length;

        return maxUploadsRemaining;
    }

    private isMediaTypeAllowed(dropEvent?): boolean {
        const type = dropEvent == null ? null : getSuperdeskType(dropEvent);
        const {config} = this.props;

        if (dropEvent != null) {
            if (
                type == null // if `dropEvent` is defined, `type` can't be null
                || (
                    (config.allowPicture !== true && type === SUPERDESK_MEDIA_TYPES.PICTURE)
                    || (config.allowVideo !== true && type === SUPERDESK_MEDIA_TYPES.VIDEO)
                    || (config.allowAudio !== true && type === SUPERDESK_MEDIA_TYPES.AUDIO)
                )
            ) {
                return false;
            }
        }

        return true;
    }

    private upload(files: Array<File>): void {
        const {config} = this.props;
        const mediaItems = this.getMediaItems();
        const maxUploadsRemaining: number | undefined = this.getMaxRemainingItemsCount();

        let uploadData = {
            files: files,
            uniqueUpload: maxUploadsRemaining === 1,
            maxUploads: maxUploadsRemaining, // accepts undefined
            allowPicture: config.allowPicture,
            allowVideo: config.allowAudio,
            allowAudio: config.allowVideo,
        };

        ng.get('superdesk').intent('upload', 'media', uploadData)
            .then((res: Array<IArticle>) => {
                const nextItems = mediaItems.concat(res);

                this.props.onChange(nextItems);

                this.mediaCarouselRef.goToPage(nextItems.length - 1);
            });
    }

    private handleDragDrop(event): void {
        const superdeskType = getSuperdeskType(event);
        const {config} = this.props;

        if (superdeskType == null) {
            return;
        }

        if (config.maxItems != null && this.getMaxRemainingItemsCount() < 1) {
            notify.error(
                gettext(
                    'Item not added. Maximum limit of {{n}} items exceeded.',
                    {n: config.maxItems},
                ),
            );

            return;
        }

        if (!this.isMediaTypeAllowed(event)) {
            const allowedMediaTypes = [];

            if (config.allowPicture) {
                allowedMediaTypes.push(gettext('image'));
            }

            if (config.allowAudio) {
                allowedMediaTypes.push(gettext('audio'));
            }

            if (config.allowVideo) {
                allowedMediaTypes.push(gettext('video'));
            }

            notify.error(
                gettext(
                    'Only the following media types are allowed: {{types}}',
                    {types: allowedMediaTypes.join(', ')},
                ),
            );

            return;
        }

        if (superdeskType === 'Files') {
            this.upload(Array.from(event.dataTransfer.files));
        } else {
            const mediaItems = this.getMediaItems();
            const __item: IArticle = JSON.parse(event.dataTransfer.getData(superdeskType));

            if (mediaItems.find((mediaItem) => mediaItem._id === __item._id) != null) {
                notify.error(gettext('This item is already added'));

                return;
            }

            const workflowValidation = validateWorkflow(
                __item,
                {
                    in_progress: config.allowedWorkflows.inProgress,
                    published: config.allowedWorkflows.published,
                },
            );

            if (workflowValidation.result !== true) {
                notify.error(workflowValidation.error);
                return;
            }

            const nextItems = mediaItems.concat(__item);

            this.props.onChange(nextItems);

            this.mediaCarouselRef.goToPage(nextItems.length - 1);
        }
    }

    render() {
        const Container = this.props.container;
        const {readOnly, config} = this.props;
        const mediaItems = this.getMediaItems();
        const canAddMultipleItems = this.getMaxRemainingItemsCount() > 1;
        const allowedMimeTypesForUpload = this.getAllowedMimeTypes();
        const canDrop = () => true;

        return (
            <Container>
                {
                    mediaItems.length > 0 && (
                        <DropZone3
                            onDrop={this.handleDragDrop}
                            canDrop={canDrop}
                            onFileSelect={this.upload}
                            multiple={canAddMultipleItems}
                            fileAccept={allowedMimeTypesForUpload}
                        >
                            <MediaCarousel
                                mediaItems={mediaItems}
                                onChange={this.props.onChange}
                                showPictureCrops={config.showPictureCrops === true}
                                showTitleInput={config.showTitleEditingInput === true}
                                readOnly={readOnly}
                                maxItemsAllowed={config.maxItems ?? maxItemsDefault}
                                ref={(component) => {
                                    this.mediaCarouselRef = component;
                                }}
                            />
                        </DropZone3>
                    )
                }

                {
                    (config.maxItems ?? maxItemsDefault) > 1 && mediaItems.length > 0 && (
                        <div>
                            <SpacerBlock v gap="16" />

                            <MediaThumbnails
                                mediaItems={mediaItems}
                                onSelect={(item) => {
                                    this.mediaCarouselRef.goToPage(mediaItems.indexOf(item));
                                }}
                                onChange={this.props.onChange}
                            />
                        </div>
                    )
                }

                {
                    (!readOnly && this.getMaxRemainingItemsCount() > 0) && (
                        <div>
                            <SpacerBlock v gap="16" />

                            <DropZone3
                                onDrop={this.handleDragDrop}
                                canDrop={canDrop}
                                onFileSelect={this.upload}
                                multiple={canAddMultipleItems}
                                fileAccept={allowedMimeTypesForUpload}
                            />
                        </div>
                    )
                }
            </Container>
        );
    }
}

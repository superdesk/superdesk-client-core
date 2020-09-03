import {forEach, get, startsWith, endsWith, some} from 'lodash';
import {getSuperdeskType, gettext, gettextPlural} from 'core/utils';
import {isMediaEditable} from 'core/config';
import {isPublished} from 'apps/archive/utils';
import {IArticle, IVocabulary} from 'superdesk-api';
import {mediaIdGenerator} from '../services/MediaIdGeneratorService';

export function getAssociationsByFieldId(associations: IArticle['associations'], fieldId: IVocabulary['_id']) {
    return Object.keys(associations ?? {})
        .filter((key) => key.startsWith(fieldId + '--') && associations[key] != null)
        .sort((key1, key2) => associations[key1].order - associations[key2].order)
        .map((key) => associations[key]);
}

/**
 * @ngdoc controller
 * @module superdesk.apps.authoring
 * @name AssociationController
 *
 * @requires $scope
 *
 * @description Controller for handling adding/uploading images to association fields
 */
export class AssociationController {
    content: any;
    superdesk: any;
    renditions: any;
    notify: any;
    checkRenditions: typeof checkRenditions;

    constructor(content, superdesk, renditions, notify) {
        this.content = content;
        this.superdesk = superdesk;
        this.renditions = renditions;
        this.notify = notify;

        this.checkRenditions = checkRenditions;
    }

    // Check if featured media can be edited or not. i.e. metadata/crops can be changed or not.
    isMediaEditable(item?: IArticle) {
        return isMediaEditable(item);
    }

    /**
     * @ngdoc method
     * @name AssociationController#uploadAndCropImages
     * @private
     * @description Opens the file upload dialog. If files contains an array of files populates
     *              the dialog with the given files. Opens the crop dialog for each uploaded file.
     * @param {Object} scope Directive scope
     * @param {Array} files
     */
    uploadAndCropImages(scope, files) {
        // in case of feature media we dont have scope.field available as it is not a vocabulary.
        const maxUploadsRemaining = scope.maxUploads != null && scope.field != null
            ? scope.maxUploads - getAssociationsByFieldId(scope.item.associations, scope.field._id).length
            : 1;

        let uploadData = {
            files: files,
            uniqueUpload: maxUploadsRemaining === 1,
            maxUploads: maxUploadsRemaining,
            allowPicture: scope.allowPicture,
            allowVideo: scope.allowVideo,
            allowAudio: scope.allowAudio,
            parent: scope.item,
        };

        this.superdesk.intent('upload', 'media', uploadData).then((images) => {
            // open the view to edit the point of interest and the cropping areas
            if (images) {
                scope.$applyAsync(() => {
                    var [rootField, index] = mediaIdGenerator.getFieldParts(scope.rel);
                    var imagesWithIds = [];

                    const editNextFile = () => {
                        if (imagesWithIds.length > 0) {
                            var imageWithId = imagesWithIds.shift();

                            this.edit(scope, imageWithId.image, {
                                customRel: imageWithId.id,
                                isNew: true,
                            }, editNextFile);
                        }
                    };

                    forEach(images, (image) => {
                        imagesWithIds.push({id: scope.rel, image: image});
                        scope.rel = mediaIdGenerator.getFieldVersionName(rootField, (++index).toString());
                    });
                    editNextFile();
                });
            }
        });
    }

    /**
     * @ngdoc method
     * @name AssociationController#updateItemAssociation
     * @private
     * @description If the item is not published then it saves the changes otherwise calls autosave.
     * @param {Object} scope Directive scope
     * @param {Object} updated Item to be edited
     * @param {String} customRel association identifier
     * @param {Function} callback to call after save
     */
    updateItemAssociation(scope, updated, customRel, callback = null, autosave = false) {
        let data = {};
        // if the media is of type media-gallery, update same association-key not the next one
        // as the scope.rel contains the next association-key of the new item
        let associationKey = scope.carouselItem ? scope.carouselItem.fieldId : customRel || scope.rel;
        const field = associationKey.split('--')[0];

        const isItemBeingAdded = updated != null && scope.item.associations[associationKey] == null;

        if (
            isItemBeingAdded
            && scope.field?.field_type === 'media' // scope.field is not available from sdItemAssociation
        ) {
            const mediaItemsForCurrentField = getAssociationsByFieldId(scope.item.associations, scope.field._id);
            const allowedItemsCount = scope.field.field_options.multiple_items?.enabled
                ? scope.field.field_options.multiple_items.max_items
                : 1;

            if (mediaItemsForCurrentField.length + 1 > allowedItemsCount) {
                this.notify.error(gettextPlural(
                    allowedItemsCount,
                    'Item was not added. Only 1 item is allowed for this field.',
                    'Item was not added. Only {{number}} items are allowed in this field.',
                    {number: allowedItemsCount},
                ));

                return;
            }

            if (mediaItemsForCurrentField.find((mediaItem) => mediaItem._id === updated._id) != null) {
                this.notify.error(gettext('This item is already added.'));
                return;
            }
        }

        if (scope.field != null && scope.field.field_type === 'media' && updated != null && updated.order == null) {
            // get greatest order from current items(or -1 if there aren't any items) and add one
            const nextOrder = (
                getAssociationsByFieldId(scope.item.associations, field)
                    .map(({order}) => order)
                    .sort((a, b) => b - a)[0] ?? -1
            ) + 1;

            updated['order'] = nextOrder;
        }
        data[associationKey] = updated;
        scope.item.associations = angular.extend({}, scope.item.associations, data);
        scope.rel = associationKey;

        let promise;

        if (!isPublished(scope.item) && updated && !autosave) {
            promise = scope.save();
        } else {
            promise = scope.onchange({item: scope.item, data: data});
        }

        if (callback) {
            return promise.then(callback);
        }

        return promise;
    }

    /**
     * @ngdoc method
     * @name AssociationController#edit
     * @public
     * @description Opens the item for edit.
     * @param {Object} scope Directive scope
     * @param {Object} item Item to be edited
     * @param {Function} callback Callback function
     */
    edit(
        scope,
        item,
        options: {isNew?: boolean, customRel?: string, defaultTab?: any, showMetadata?: boolean} = {},
        callback = null,
    ) {
        if (!this.isMediaEditable()) {
            return;
        }

        const _isImage = checkRenditions.isImage(item.renditions.original);
        const defaultTab = _isImage ? 'crop' : 'view';

        const cropOptions = {
            isNew: 'isNew' in options ? options.isNew : false,
            editable: !!scope.editable,
            isAssociated: true,
            defaultTab: 'defaultTab' in options ? options.defaultTab : defaultTab,
            showMetadata: 'showMetadata' in options ? options.showMetadata : true,
        };

        if (item.renditions && item.renditions.original) {
            scope.loading = true;
            return this.renditions.crop(item, cropOptions)
                .then((rendition) => {
                    this.updateItemAssociation(scope, rendition, options.customRel, callback);
                })
                .finally(() => {
                    scope.loading = false;
                });
        } else {
            scope.loading = false;
        }

        this.updateItemAssociation(scope, item, options.customRel, callback);
    }

    addAssociation(scope, __item: IArticle): void {
        if (!scope.editable) {
            return;
        }

        this.content.dropItem(__item)
            .then((item) => {
                if (item.lock_user) {
                    this.notify.error(gettext('Item is locked. Cannot associate media item.'));
                    return;
                }

                // save generated association id in order to be able to update the same item after editing.
                const originalRel = scope.rel;

                if (this.isMediaEditable(item) && get(item, '_type') === 'externalsource') {
                    // if media is editable then association will be updated by this.edit method
                    return this.renditions.ingest(item)
                        .then((_item) => this.edit(scope, _item, {customRel: originalRel}));
                } else {
                    // Update the association if media is not editable.
                    this.updateItemAssociation(scope, item, null, null, true);
                }
            })
            .finally(() => {
                scope.loading = false;
            });
    }

    /**
     * @ngdoc method
     * @public
     * @description Initialize upload on drop in field
     * @param {Object} scope Directive scope
     * @param {Object} event Drop event
     */
    initializeUploadOnDrop(scope, event): void {
        const superdeskType = getSuperdeskType(event);

        if (superdeskType === 'Files') {
            if (!scope.editable) {
                return;
            }

            if (this.isMediaEditable()) {
                const files = event.originalEvent.dataTransfer.files;

                return this.uploadAndCropImages(scope, files);
            }

            return;
        }

        const __item: IArticle = JSON.parse(event.originalEvent.dataTransfer.getData(superdeskType));

        scope.loading = true;
        this.addAssociation(scope, __item);
    }
}

AssociationController.$inject = ['content', 'superdesk', 'renditions', 'notify'];

const isImage = (rendition) => {
    return startsWith(rendition.mimetype, 'image');
};

const isAudio = (rendition) => {
    if (startsWith(rendition.mimetype, 'audio')) {
        return true;
    }

    return some(
        ['.mp3', '.3gp', '.wav', '.ogg', 'wma', 'aa', 'aiff'],
        (ext) => endsWith(rendition.href, ext),
    );
};

const isVideo = (rendition) => {
    if (startsWith(rendition.mimetype, 'video')) {
        return true;
    }

    return some(['.mp4', '.webm', '.ogv', '.ogg'], (ext) => endsWith(rendition.href, ext));
};

export const checkRenditions = {
    isImage: isImage,
    isAudio: isAudio,
    isVideo: isVideo,
};

import {forEach, get, startsWith, endsWith, some} from 'lodash';
import {getSuperdeskType, gettext, gettextPlural} from 'core/utils';
import {isMediaEditable} from 'core/config';
import {isPublished} from 'apps/archive/utils';
import {IArticle, IVocabulary} from 'superdesk-api';
import {mediaIdGenerator} from '../services/MediaIdGeneratorService';

export function getAssociationsByField(item: IArticle, field: IVocabulary) {
    return Object.keys(item.associations || {})
        .filter((key) => key.startsWith(field._id) && item.associations[key] != null)
        .map((key) => item.associations[key]);
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
AssociationController.$inject = ['content', 'superdesk', 'renditions', 'notify'];
export function AssociationController(content, superdesk, renditions, notify) {
    const self = this;

    this.checkRenditions = checkRenditions;

    /**
     * @ngdoc method
     * @name AssociationController#isMediaEditable
     * @public
     * @description Check if featured media can be edited or not. i.e. metadata/crops can be changed or not.
     */
    this.isMediaEditable = function(item?: IArticle) {
        return isMediaEditable(item);
    };

    /**
     * @ngdoc method
     * @name AssociationController#uploadAndCropImages
     * @private
     * @description Opens the file upload dialog. If files contains an array of files populates
     *              the dialog with the given files. Opens the crop dialog for each uploaded file.
     * @param {Object} scope Directive scope
     * @param {Array} files
     */
    this.uploadAndCropImages = function(scope, files) {
        // in case of feature media we dont have scope.field available as it is not a vocabulary.
        const maxUploadsRemaining = scope.maxUploads != null && scope.field != null
            ? scope.maxUploads - getAssociationsByField(scope.item, scope.field).length
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

        superdesk.intent('upload', 'media', uploadData).then((images) => {
            // open the view to edit the point of interest and the cropping areas
            if (images) {
                scope.$applyAsync(() => {
                    var [rootField, index] = mediaIdGenerator.getFieldParts(scope.rel);
                    var imagesWithIds = [];

                    function editNextFile() {
                        if (imagesWithIds.length > 0) {
                            var imageWithId = imagesWithIds.shift();

                            self.edit(scope, imageWithId.image, {
                                customRel: imageWithId.id,
                                isNew: true,
                            }, editNextFile);
                        }
                    }

                    forEach(images, (image) => {
                        imagesWithIds.push({id: scope.rel, image: image});
                        scope.rel = mediaIdGenerator.getFieldVersionName(rootField, (++index).toString());
                    });
                    editNextFile();
                });
            }
        });
    };

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
    this.updateItemAssociation = function(scope, updated, customRel, callback = null, autosave = false) {
        let data = {};
        // if the media is of type media-gallery, update same association-key not the next one
        // as the scope.rel contains the next association-key of the new item
        let associationKey = scope.carouselItem ? scope.carouselItem.fieldId : customRel || scope.rel;

        const isItemBeingAdded = updated != null && scope.item.associations[associationKey] == null;

        if (
            isItemBeingAdded
            && scope.field?.field_type === 'media' // scope.field is not available from sdItemAssociation
        ) {
            const mediaItemsForCurrentField = getAssociationsByField(scope.item, scope.field);
            const allowedItemsCount = scope.field.field_options.multiple_items?.enabled
                ? scope.field.field_options.multiple_items.max_items
                : 1;

            if (mediaItemsForCurrentField.length + 1 > allowedItemsCount) {
                notify.error(gettextPlural(
                    allowedItemsCount,
                    'Item was not added. Only 1 item is allowed for this field.',
                    'Item was not added. Only {{number}} items are allowed in this field.',
                    {number: allowedItemsCount},
                ));

                return;
            }

            if (mediaItemsForCurrentField.find((mediaItem) => mediaItem._id === updated._id) != null) {
                notify.error(gettext('This item is already added.'));
                return;
            }
        }

        if (scope.field != null && scope.field.field_type === 'media' && updated != null && updated.order == null) {
            // if the field is of type media-gallery, assign order to the item being added
            updated['order'] = scope.currentIndex;
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
    };

    /**
     * @ngdoc method
     * @name AssociationController#edit
     * @public
     * @description Opens the item for edit.
     * @param {Object} scope Directive scope
     * @param {Object} item Item to be edited
     * @param {Function} callback Callback function
     */
    this.edit = function(
        scope,
        item,
        options: {isNew?: boolean, customRel?: string, defaultTab?: any, showMetadata?: boolean} = {},
        callback = null,
    ) {
        if (!self.isMediaEditable()) {
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
            return renditions.crop(item, cropOptions)
                .then((rendition) => {
                    self.updateItemAssociation(scope, rendition, options.customRel, callback);
                })
                .finally(() => {
                    scope.loading = false;
                });
        } else {
            scope.loading = false;
        }

        self.updateItemAssociation(scope, item, options.customRel, callback);
    };

    this.addAssociation = function(scope, __item: IArticle): void {
        if (!scope.editable) {
            return;
        }

        content.dropItem(__item)
            .then((item) => {
                if (item.lock_user) {
                    notify.error(gettext('Item is locked. Cannot associate media item.'));
                    return;
                }

                // save generated association id in order to be able to update the same item after editing.
                const originalRel = scope.rel;

                if (self.isMediaEditable(item) && get(item, '_type') === 'externalsource') {
                    // if media is editable then association will be updated by self.edit method
                    return renditions.ingest(item)
                        .then((_item) => self.edit(scope, _item, {customRel: originalRel}));
                } else {
                    // Update the association if media is not editable.
                    self.updateItemAssociation(scope, item, null, null, true);
                }
            })
            .finally(() => {
                scope.loading = false;
            });
    };

    /**
     * @ngdoc method
     * @public
     * @description Initialize upload on drop in field
     * @param {Object} scope Directive scope
     * @param {Object} event Drop event
     */
    this.initializeUploadOnDrop = function(scope, event): void {
        const superdeskType = getSuperdeskType(event);

        if (superdeskType === 'Files') {
            if (!scope.editable) {
                return;
            }

            if (self.isMediaEditable()) {
                const files = event.originalEvent.dataTransfer.files;

                return self.uploadAndCropImages(scope, files);
            }

            return;
        }

        const __item: IArticle = JSON.parse(event.originalEvent.dataTransfer.getData(superdeskType));

        scope.loading = true;

        this.addAssociation(scope, __item);
    };
}

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

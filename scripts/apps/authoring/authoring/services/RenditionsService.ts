import {IArticle} from 'superdesk-api';

/**
 * @ngdoc service
 * @module superdesk.apps.authoring
 * @name renditions
 * @description Renditions Service allows the user to generate different crops.
 */
RenditionsService.$inject = ['metadata', '$q', 'api', 'superdesk', 'lodash'];
export function RenditionsService(metadata, $q, api, superdesk, _) {
    var self = this;

    /**
     *  ngdoc method
     *  @name renditions#ingest
     *  @public
     *  @description Ingest the picture from external source.
     *
     *  @return {promise}
     */
    this.ingest = function(item) {
        var performRenditions = $q.when(item);
        // ingest picture if it comes from an external source (create renditions)

        if (item._type && item._type === 'externalsource') {
            performRenditions = superdesk.intent('list', 'externalsource', {item: item}, 'fetch-externalsource')
                .then((_item) => api.find('archive', _item._id));
        }
        return performRenditions;
    };

    /**
     *  ngdoc method
     *  @name renditions#get
     *  @public
     *  @description Get the crop sizes.
     *
     *  @return {promise} picture crops
     */
    this.get = function() {
        return metadata.initialize().then(() => {
            self.renditions = metadata.values.crop_sizes;
            return self.renditions;
        });
    };

    /**
     *  ngdoc method
     *  @name renditions#crop
     *  @public
     *  @description Crop the images.
     *
     *  @param {Object} item Media item
     *  @param {boolean} isNew to indicate if picture is new or not
     *  @param {boolean} editable to indicate if picture is editable or not
     *  @param {boolean} isAssociated to indicate if picture is isAssociated or not
     *  @return {promise} returns the modified picture item
     */
    this.crop = function(item, options): Promise<IArticle> {
        const clonedItem = _.extend({}, item);

        clonedItem.renditions = _.cloneDeep(clonedItem.renditions);

        return self.get().then((renditions) => {
            // we want to crop only renditions that change the ratio
            let withRatio = _.filter(renditions, (rendition) => angular.isDefined(rendition.ratio));

            if (!withRatio.length) {
                withRatio = self.renditions;
            }

            // Merge options with defauts
            const cropOptions = {
                isNew: true,
                isAssociated: false,
                editable: true,
                defaultTab: false,
                tabs: item.type === 'picture' ? ['view', 'image-edit', 'crop'] : ['view'],
                showMetadata: false,
                ...options,
            };

            return superdesk.intent('edit', 'crop', {
                item: clonedItem,
                renditions: withRatio,
                poi: clonedItem.poi,
                showAoISelectionButton: true,
                showMetadataEditor: true,
                ...cropOptions,
            })
                .then((metaData) => {
                    // apply the metadata changes
                    return _.extend(item, metaData);
                }).catch((response) => {
                    // if new crops not generated continue with default one
                    // see https://github.com/superdesk/superdesk-client-core/pull/3117#discussion_r328440897
                    if (response != null && response.done === true) {
                        return item;
                    }
                });
        });
    };
}

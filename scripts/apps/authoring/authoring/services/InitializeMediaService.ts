import _ from 'lodash';
import {mediaIdGenerator} from './MediaIdGeneratorService';

var mediaFields = {};
const MEDIA_TYPES = ['video', 'picture', 'audio'];

/**
    * @ngdoc method
    * @description Returns true if the given string is a vocabulary media
    *              field identifier, false otherwise.
    * @param {string} fieldId
    * @return {bool}
    */
function isMediaField(fieldId, $scope) {
    var parts = mediaIdGenerator.getFieldParts(fieldId);
    var field = _.find($scope.fields, (_field) => _field._id === parts[0]);

    return field && field.field_type === 'media';
}

/**
 * @ngdoc method
 * @description Generates an array of name versions for a given vocabulary
 *              media field.
 * @param {string} fieldId
 */
function computeMediaFieldVersions(fieldId, $scope) {
    $scope.mediaFieldVersions[fieldId] = [];

    var field = _.find($scope.fields, (_field) => _field._id === fieldId);

    if (field) {
        var multipleItems = _.get(field, 'field_options.multiple_items.enabled');
        var maxItems = !multipleItems ? 1 : _.get(field, 'field_options.multiple_items.max_items');

        if (!maxItems || !mediaFields[fieldId] || mediaFields[fieldId].length <= maxItems) {
            addMediaFieldVersion(fieldId, getNewMediaFieldId(fieldId, $scope), $scope);
        }
        _.forEach(mediaFields[fieldId], (version) => {
            addMediaFieldVersion(fieldId, mediaIdGenerator.getFieldVersionName(fieldId, version), $scope);
        });
    }
}

function addMediaFieldVersion(fieldId, fieldVersion, $scope) {
    var field = {fieldId: fieldVersion};

    if (_.has($scope.item.associations, fieldVersion)) {
        field[fieldVersion] = $scope.item.associations[fieldVersion];
    } else {
        field[fieldVersion] = null;
    }
    $scope.mediaFieldVersions[fieldId].push(field);
}

/**
 * @ngdoc method
 * @description Adds the version of the given field name to the versions array.
 * @param {string} fieldId
 */
function addMediaField(fieldId) {
    var [rootField, index] = mediaIdGenerator.getFieldParts(fieldId);

    if (!_.has(mediaFields, rootField)) {
        mediaFields[rootField] = [];
    }
    mediaFields[rootField].push(index);
    mediaFields[rootField].sort((a, b) => {
        if (b === null || b === undefined) {
            return -1;
        }
        if (a === null || a === undefined) {
            return 1;
        }
        return b - a;
    });
}

/**
 * @ngdoc method
 * @description Initializes arrays containing the media fields versions.
 */
function initMedia($scope) {
    mediaFields = {};
    $scope.mediaFieldVersions = {};
    _.forEach($scope.item.associations, (association, fieldId) => {
        if (association && _.findIndex(MEDIA_TYPES, (type) => type === association.type) !== -1
            && isMediaField(fieldId, $scope)) {
            addMediaField(fieldId);
        }
    });

    if ($scope.contentType && $scope.contentType.schema) {
        _.forEach($scope.fields, (field) => {
            if (isMediaField(field._id, $scope)) {
                computeMediaFieldVersions(field._id, $scope);
            }
        });
    }
}

/**
 * @ngdoc method
 * @description Returns a new name version for a given media field.
 * @param {String} fieldId
 * @return {String}
 */
function getNewMediaFieldId(fieldId, $scope) {
    var field = _.find($scope.fields, (_field) => _field._id === fieldId);
    var multipleItems = field ? _.get(field, 'field_options.multiple_items.enabled') : false;
    var parts = mediaIdGenerator.getFieldParts(fieldId);
    var newIndex = multipleItems ? 1 : null;

    if (_.has(mediaFields, parts[0])) {
        var fieldVersions = mediaFields[parts[0]];

        newIndex = fieldVersions.length ? 1 + fieldVersions[0] : 1;
    }
    return mediaIdGenerator.getFieldVersionName(parts[0], newIndex == null ? null : newIndex.toString());
}

export const InitializeMedia = {
    initMedia,

};

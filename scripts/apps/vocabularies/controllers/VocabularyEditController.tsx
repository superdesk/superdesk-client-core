import ReactDOM from 'react-dom';
import React from 'react';
import _ from 'lodash';
import {IVocabularySelectionTypes, getVocabularySelectionTypes, getMediaTypeKeys, getMediaTypes} from '../constants';
import {gettext} from 'core/utils';
import {getFields} from 'apps/fields';
import {IVocabulary} from 'superdesk-api';
import {IScope as IScopeConfigController} from './VocabularyConfigController';
import {VocabularyItemsViewEdit} from '../components/VocabularyItemsViewEdit';
import {dataApi} from 'core/helpers/CrudManager';

VocabularyEditController.$inject = [
    '$scope',
    'notify',
    'api',
    'metadata',
    'cvSchema',
    'relationsService',
    '$timeout',
    '$element',
];

interface IScope extends IScopeConfigController {
    setFormDirty: () => void;
    newItemTemplate: any;
    idRegex: string;
    vocabulary: IVocabulary;
    selectionTypes: IVocabularySelectionTypes;
    closeVocabulary: () => void;
    updateVocabulary: (result: any) => void;
    issues: Array<any> | null;
    _errorUniqueness: boolean;
    errorMessage: string;
    save: () => void;
    requireAllowedTypesSelection: () => void;
    addItem: () => void;
    cancel: () => void;
    uploadConfigFile: () => void;
    addFiles(files: Array<File>): void;
    configFiles: Array<File>;
    uploadFile(): void;
    model: any;
    schema: any;
    schemaFields: Array<any>;
    itemsValidation: { valid: boolean };
    customFieldTypes: Array<{id: string, label: string}>;
    setCustomFieldConfig: (config: any) => void;
    editForm: any;
    tab: 'general' | 'items';
    setTab: (tab: IScope['tab']) => void;
}

const idRegex = '^[a-zA-Z0-9-_]+$';
const RESOURCE = 'upload/config-file';

export function VocabularyEditController(
    $scope: IScope, notify, api, metadata, cvSchema, relationsService, $timeout,
) {
    let componentRef: VocabularyItemsViewEdit = null;

    var origVocabulary = _.cloneDeep($scope.vocabulary);

    $scope.tab = 'general';

    $scope.setTab = function(tab: IScope['tab']) {
        $scope.tab = tab;
    };

    $scope.idRegex = idRegex;
    $scope.selectionTypes = getVocabularySelectionTypes();

    if ($scope.matchFieldTypeToTab('related-content-fields', $scope.vocabulary.field_type)) {
        // Insert default allowed workflows
        if ($scope.vocabulary.field_options == null) {
            $scope.vocabulary.field_options = {allowed_workflows: relationsService.getDefaultAllowedWorkflows()};
        } else if ($scope.vocabulary.field_options.allowed_workflows == null) {
            $scope.vocabulary.field_options.allowed_workflows = relationsService.getDefaultAllowedWorkflows();
        }
    }

    function onSuccess(result) {
        notify.success(gettext('Vocabulary saved successfully'));

        $scope.closeVocabulary();
        $scope.updateVocabulary(result);
        $scope.issues = null;
    }

    function onError(response) {
        if (angular.isDefined(response.data._issues)) {
            if (angular.isDefined(response.data._issues['validator exception'])) {
                notify.error(gettext('Error: ' +
                                     response.data._issues['validator exception']));
            } else if (angular.isDefined(response.data._issues.error) &&
                       response.data._issues.error.required_field) {
                let params = response.data._issues.params;

                notify.error(gettext(
                    'Required {{field}} in item {{item}}', {field: params.field, item: params.item}));
            } else {
                $scope.issues = response.data._issues;
                notify.error(gettext('Error. Vocabulary not saved.'));
            }
        }
    }

    function checkForUniqueValues() {
        const uniqueField = $scope.vocabulary.unique_field || 'qcode';
        const list = $scope.vocabulary.items || [];

        if (list.find((item) => uniqueField in item)) {
            const uniqueList = _.uniqBy(list, (item) => item[uniqueField]);

            return list.length === uniqueList.length;
        }
        return true;
    }

    /**
     * Upload Config file.
     */
    $scope.uploadConfigFile = () => {
        const formData = new FormData();

        $scope.configFiles.forEach((file) => formData.append('json_file', file));

        dataApi.uploadFile('/' + RESOURCE, formData)
            .then((res: any) => {
                if (res._success) {
                    res.items.forEach((item) => $scope.updateVocabulary(item));
                    $scope.closeVocabulary();
                    notify.success(gettext(res._success._message));
                } else if (res._error) {
                    notify.error(gettext(res._error._message));
                }
            })
            .catch((error) => {
                notify.error(gettext(error._message));
            });
    };

    $scope.addFiles = function(files: Array<File>) {
        if (files.length > 0) {
            $scope.configFiles = files;
        }
    };

    $scope.uploadFile = function() {
        const elem = $('#uploadConfigFile');

        elem.click();
    };

    /**
     * Save current edit modal contents on backend.
     */
    $scope.save = function() {
        $scope.vocabulary.items = componentRef.getItemsForSaving();
        $scope._errorUniqueness = false;
        $scope.errorMessage = null;
        delete $scope.vocabulary['_deleted'];

        if ($scope.vocabulary._id === 'crop_sizes') {
            var activeItems = _.filter($scope.vocabulary.items, (o) => o.is_active);

            activeItems.forEach(({width, height, name}: any) => {
                if (parseInt(height, 10) < 200 || parseInt(width, 10) < 200) {
                    $scope.errorMessage = gettext('Minimum height and width should be greater than or equal to 200');
                }

                if (!name || name.match(idRegex) === null) {
                    $scope.errorMessage =
                        gettext('Name field should only have alphanumeric characters, dashes and underscores');
                }
            });
        }

        if (!checkForUniqueValues()) {
            const uniqueField = $scope.vocabulary.unique_field || 'qcode';

            $scope.errorMessage = gettext('The values should be unique for {{uniqueField}}', {uniqueField});
        }

        if ($scope.vocabulary.field_type === getMediaTypes().GALLERY.id) {
            const allowedTypes = $scope.vocabulary.field_options.allowed_types;

            Object.keys(allowedTypes).forEach((key) => {
                if (!['picture', 'video', 'audio'].includes(key)) {
                    allowedTypes[key] = false;
                }
            });
        }

        if (_.isNil($scope.errorMessage)) {
            api.save(
                'vocabularies',
                $scope.vocabulary,
                undefined,
                undefined,
                undefined,
                {skipPostProcessing: true},
            ).then(onSuccess, onError);
        }

        // discard metadata cache:
        metadata.loaded = null;
        metadata.initialize();
    };

    /**
     * Return true if at least one content type should be selected
     */
    $scope.requireAllowedTypesSelection = function() {
        if (!getMediaTypeKeys().includes($scope.vocabulary.field_type)) {
            return false;
        }

        if ($scope.vocabulary.field_options == null || $scope.vocabulary.field_options.allowed_types == null) {
            return true;
        }

        const allowedTypes = $scope.vocabulary.field_options.allowed_types;
        const selectedKeys = Object.keys(allowedTypes).filter((key) => allowedTypes[key] === true);

        return selectedKeys.length === 0;
    };

    /**
     * Discard changes and close modal.
     */
    $scope.cancel = function() {
        $scope.closeVocabulary();
        $scope.updateVocabulary(origVocabulary);
    };

    // try to reproduce data model of vocabulary:
    var model = _.mapValues(_.keyBy(
        _.uniq(_.flatten(
            _.map($scope.vocabulary.items, (o) => _.keys(o)),
        )),
    ), () => null);

    $scope.model = model;
    $scope.schema = $scope.vocabulary.schema || cvSchema[$scope.vocabulary._id] || null;

    if ($scope.schema) {
        $scope.schemaFields = Object.keys($scope.schema)
            .sort()
            .map((key) => angular.extend(
                {key: key},
                $scope.schema[key],
            ));
    }

    $scope.schemaFields = $scope.schemaFields
        || Object.keys($scope.model)
            .filter((key) => key !== 'is_active')
            .map((key) => ({key: key, label: key, type: key}));

    $scope.itemsValidation = {valid: true};

    const fields = getFields();

    $scope.customFieldTypes = Object.keys(fields).map((id) => ({
        id: id,
        label: fields[id].label,
    }));

    $scope.setCustomFieldConfig = (config) => {
        $scope.vocabulary.custom_field_config = config;
        $scope.editForm.$setDirty();
        $scope.$apply();
    };

    let placeholderElement = null;

    // wait for the template to render to the placeholder element is available
    $timeout(() => {
        placeholderElement = document.querySelector('#vocabulary-items-view-edit-placeholder');

        ReactDOM.render((
            <VocabularyItemsViewEdit
                ref={(ref) => {
                    componentRef = ref;
                }}
                items={$scope.vocabulary.items}
                schemaFields={$scope.schemaFields}
                newItemTemplate={{...$scope.model, is_active: true}}
                setDirty={() => {
                    $scope.editForm.$setDirty();
                    $scope.$apply();
                }}
                setItemsValid={(valid) => {
                    $scope.itemsValidation.valid = valid;
                    $scope.$apply();
                }}
            />
        ), placeholderElement);
    });

    $scope.$watch('errorMessage', (errorMessage: string) => {
        componentRef?.setErrorMessage(errorMessage ?? null);
    });

    $scope.$on('$destroy', () => {
        if (placeholderElement != null) {
            ReactDOM.unmountComponentAtNode(placeholderElement);
        }
    });
}

import ReactDOM from 'react-dom';
import React from 'react';
import _ from 'lodash';
import {IVocabularySelectionTypes, getVocabularySelectionTypes, getMediaTypeKeys, getMediaTypes} from '../constants';
import {gettext} from 'core/utils';
import {getFields} from 'apps/fields';
import {IArticle, IVocabulary, RICH_FORMATTING_OPTION} from 'superdesk-api';
import {IScope as IScopeConfigController} from './VocabularyConfigController';
import {VocabularyItemsViewEdit} from '../components/VocabularyItemsViewEdit';
import {defaultAllowedWorkflows} from 'apps/relations/services/RelationsService';
import {EDITOR_BLOCK_FIELD_TYPE} from 'apps/workspace/content/constants';
import {getEditor3RichTextFormattingOptions} from 'apps/workspace/content/components/get-content-profiles-form-config';

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
    item?: Partial<IArticle>;
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
    formattingOptionsOnChange?: (options: Array<RICH_FORMATTING_OPTION>) => void;
    editorBlockFormattingOptions?: Array<{value: [RICH_FORMATTING_OPTION, string]}>;
    updateUI: () => void;
    requestEditor3DirectivesToGenerateHtml: Array<() => void>;
    handleTemplateValueChange: (value: string) => void;
    requireAllowedTypesSelection: () => void;
    addItem: () => void;
    cancel: () => void;
    model: any;
    schema: any;
    schemaFields: Array<any>;
    itemsValidation: {valid: boolean};
    customFieldTypes: Array<{id: string, label: string}>;
    setCustomFieldConfig: (config: any) => void;
    editForm: any;
    tab: 'general' | 'items';
    setTab: (tab: IScope['tab']) => void;
}

const idRegex = '^[a-zA-Z0-9-_]+$';
const editorBlockFieldId = 'editor_block_field';

export function VocabularyEditController(
    $scope: IScope, notify, api, metadata, cvSchema, relationsService, $timeout,
) {
    let componentRef: VocabularyItemsViewEdit = null;

    var origVocabulary = _.cloneDeep($scope.vocabulary);

    $scope.tab = 'general';

    $scope.setTab = function(tab: IScope['tab']) {
        $scope.tab = tab;
    };

    $scope.requestEditor3DirectivesToGenerateHtml = [];

    $scope.idRegex = idRegex;
    $scope.selectionTypes = getVocabularySelectionTypes();

    if (
        $scope.matchFieldTypeToTab('related-content-fields', $scope.vocabulary.field_type)
        && $scope.vocabulary.field_type === 'related_content'
    ) {
        const vocab = $scope.vocabulary;

        // Insert default allowed workflows
        vocab.field_options = {
            ...(vocab.field_options ?? {}),
            allowed_workflows: defaultAllowedWorkflows,
        };
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

    if ($scope.vocabulary.field_type === EDITOR_BLOCK_FIELD_TYPE) {
        const vocabulary = $scope.vocabulary;

        $scope.item = {
            fields_meta: {

                /**
                 * Fake field, needed for compatibility with sdEditor3 directive
                 */
                [editorBlockFieldId]: {draftjsState: vocabulary.field_options?.template},
            },
        };

        $scope.editorBlockFormattingOptions = (() => {
            const excludedOptions: Set<RICH_FORMATTING_OPTION> = new Set<RICH_FORMATTING_OPTION>([
                'multi-line quote',
                'comments',
                'annotation',
                'suggestions',
                'table',
                'media',
            ]);

            const formattingOptions = Object.entries(getEditor3RichTextFormattingOptions())
                .map(([notTranslatedOption, translatedOption]) => ({value: [notTranslatedOption, translatedOption]}))
                .filter(({value}: {value: [RICH_FORMATTING_OPTION, string]}) =>
                    excludedOptions.has(value[0]) === false,
                );

            return formattingOptions as Array<{value: [RICH_FORMATTING_OPTION, string]}>;
        })();

        $scope.formattingOptionsOnChange = function(options) {
            vocabulary.field_options = {
                formatting_options: options,
            };

            $scope.updateUI();

            /**
             * Apply current changes to item and save them to the field as html,
             * so when formatting options are updated editor sill has the changes
             */
            $scope.requestEditor3DirectivesToGenerateHtml.forEach((fn) => {
                fn();
            });

            $scope.$broadcast('formattingOptions-update', {
                editorFormat: options,
                editorState: $scope.item.fields_meta[editorBlockFieldId].draftjsState,
            });
        };
    }

    /**
     * Save current edit modal contents on backend.
     */
    $scope.save = function() {
        $scope.vocabulary.items = componentRef.getItemsForSaving();
        $scope._errorUniqueness = false;
        $scope.errorMessage = null;
        delete $scope.vocabulary['_deleted'];

        if ($scope.vocabulary.field_type === EDITOR_BLOCK_FIELD_TYPE) {
            $scope.requestEditor3DirectivesToGenerateHtml.forEach((fn) => {
                fn();
            });
            $scope.vocabulary.field_options = $scope.vocabulary.field_options ?? {};
            $scope.vocabulary.field_options = {
                ...$scope.vocabulary.field_options,
                template: $scope.item.fields_meta?.[editorBlockFieldId].draftjsState,
            };
        }

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

        if ($scope.vocabulary.field_type !== 'related_content') {
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
        const editing = origVocabulary?._id != null;

        if (editing) {
            $scope.updateVocabulary(origVocabulary);
        }

        $scope.closeVocabulary();
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

    $scope.customFieldTypes = Object.keys(fields).filter((id) => fields[id].private !== true).map((id) => ({
        id: id,
        label: fields[id].label,
    }));

    $scope.updateUI = () => {
        $scope.editForm.$setDirty();
        $scope.$applyAsync();
    };

    $scope.setCustomFieldConfig = (config) => {
        $scope.vocabulary.custom_field_config = config;
        $scope.updateUI();
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
                    $scope.updateUI();
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

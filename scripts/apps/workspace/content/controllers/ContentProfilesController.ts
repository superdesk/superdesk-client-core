import {cloneDeep, get, isEqual} from 'lodash';
import {gettext} from 'core/utils';
import {IContentProfile, IRestApiResponse} from 'superdesk-api';
import {appConfig} from 'appConfig';
import {assertNever, nameof} from 'core/helpers/typescript-helpers';
import {httpRequestJsonLocal} from 'core/helpers/network';

export enum IContentProfileTypeNonText {
    text = 'text',
    image = 'image',
    audio = 'audio',
    video = 'video',
    package = 'package',
}

const allContentProfileTypes: Array<IContentProfileTypeNonText> =
    Object.keys(IContentProfileTypeNonText).map((key) => IContentProfileTypeNonText[key]);

interface IScope extends ng.IScope {
    creating: boolean;
    editing: {[key: string]: any};
    new: {[key: string]: any};
    active_only: boolean;
    contentTypeFilter: string | null;
    ngForm: any;
    withEditor3: boolean;
    contentProfileTypes: Array<{
        label: string;
        value: string;
        disabled: boolean;
        icon: string;
    }>;
    setNgForm(ngForm): void;
    patchContentProfile(patch: Partial<IContentProfile>): void;
    getContentProfileIconByProfileType(type: IContentProfile['type']): string;
    toggleContentProfileFilter(type: IContentProfile['type']): void;
}

function getContentProfileIcon(type: IContentProfileTypeNonText): string {
    switch (type) {
    case IContentProfileTypeNonText.text:
        return 'icon-text';
    case IContentProfileTypeNonText.image:
        return 'icon-picture';
    case IContentProfileTypeNonText.audio:
        return 'icon-audio';
    case IContentProfileTypeNonText.video:
        return 'icon-video';
    case IContentProfileTypeNonText.package:
        return 'icon-composite';
    default:
        return assertNever(type);
    }
}

function getLabelForContentProfileType(type: IContentProfileTypeNonText): string {
    switch (type) {
    case IContentProfileTypeNonText.text:
        return gettext('Text');
    case IContentProfileTypeNonText.image:
        return gettext('Image');
    case IContentProfileTypeNonText.audio:
        return gettext('Audio');
    case IContentProfileTypeNonText.video:
        return gettext('Video');
    case IContentProfileTypeNonText.package:
        return gettext('Package');
    default:
        return assertNever(type);
    }
}

ContentProfilesController.$inject = ['$scope', '$location', 'notify', 'content', 'modal', '$q'];
export function ContentProfilesController($scope: IScope, $location, notify, content, modal, $q) {
    var self = this;

    // creating will be true while the modal for creating a new content
    // profile is visible.
    $scope.creating = false;

    // editing will hold data about the content profile being edited, as well
    // as the bind to the editing form. If no profile is being edited, it will
    // be null.
    $scope.editing = null;

    $scope.active_only = false;

    // required for being able to mark the form as dirty and enable the save button
    // after saving content profile widgets config
    $scope.setNgForm = (ngForm) => {
        $scope.ngForm = ngForm;
    };

    $scope.patchContentProfile = (patch: Partial<IContentProfile>) => {
        Object.assign($scope.editing.form, patch);

        $scope.$applyAsync(() => {
            $scope.ngForm.$dirty = true;
        });
    };

    $scope.getContentProfileIconByProfileType = (type: IContentProfile['type']) => {
        return getContentProfileIcon(IContentProfileTypeNonText[type]);
    };

    $scope.contentTypeFilter = null;

    $scope.toggleContentProfileFilter = (type: IContentProfile['type']) => {
        if ($scope.contentTypeFilter === type) {
            $scope.contentTypeFilter = null;
        } else {
            $scope.contentTypeFilter = type;
        }
    };

    $scope.withEditor3 = appConfig.features != null && appConfig.features.editor3;

    /**
     * @description Refreshes the list of content profiles by fetching them.
     * @returns {Promise}
     * @private
     */
    function refreshList(callEditActive) {
        return content.getTypes(true).then((types) => {
            self.items = types;
            if (callEditActive) {
                editActive();
            }
        });
    }

    /**
     * @description Start editing active profile
     * @private
     */
    function editActive() {
        $scope.editing = null;

        if ($location.search()._id) {
            const active = self.items.find((p) => p._id === $location.search()._id);

            if (active) {
                content.getTypeMetadata(active._id).then((type) => {
                    $scope.editing = {
                        form: cloneDeep(type),
                        original: cloneDeep(type),
                    };
                }, () => {
                    $scope.editing = {
                        form: cloneDeep(active),
                        original: active,
                    };
                });
            }
        }
    }

    function setContentProfiles() {
        $scope.contentProfileTypes = []; // loading

        httpRequestJsonLocal<IRestApiResponse<IContentProfile>>({
            method: 'GET',
            path: '/content_types',
            urlParams: {
                where: {type: {$ne: 'text'}},
            },
        }).then((res) => {
            const existingTypes = new Set(res._items.map((profile) => IContentProfileTypeNonText[profile.type]));

            $scope.contentProfileTypes = allContentProfileTypes.map((type) => ({
                label: getLabelForContentProfileType(type),
                value: type,
                disabled: existingTypes.has(type),
                icon: getContentProfileIcon(type),
            }));
        });
    }

    /**
     * @description Reports that an error has occurred.
     * @private
     */
    function reportError(resp) {
        let message = get(resp, 'data._issues["validator exception"]') || '';

        notify.error(`Operation failed ${message} (check console for response).`);
        console.error(resp);
        return $q.reject(resp);
    }

    $scope.$on('resource:updated', (event, data) => {
        if (data.resource === 'content_types' && data.fields[nameof<IContentProfile>('type')] === 1) {
            setContentProfiles();
        }
    });

    /**
     * @description Middle-ware that checks an error response to verify whether
     * it is a duplication error.
     * @param {Function} next The function to be called when error is not a
     * duplication error.
     * @private
     */
    function uniqueError(next) {
        return function(resp) {
            if (angular.isObject(resp) &&
                angular.isObject(resp.data) &&
                angular.isObject(resp.data._issues) &&
                angular.isObject(resp.data._issues.label) &&
                resp.data._issues.label.unique) {
                notify.error(self.duplicateErrorTxt);
                return $q.reject(resp);
            }
            return next(resp);
        };
    }

    this.duplicateErrorTxt = gettext('A content profile with this name already exists.');

    /**
     * @description Toggles the visibility of the creation modal.
     */
    this.toggleCreate = function() {
        $scope.new = {};
        $scope.creating = !$scope.creating;
    };

    /**
     * @description Toggles the visibility of the profile editing modal.
     * @param {Object} p the content profile being edited.
     */
    this.toggleEdit = function(p) {
        $location.search({_id: p ? p._id : null});
        $scope.$applyAsync(editActive);
    };

    /**
     * @description Creates a new content profile.
     */
    this.save = function() {
        var onSuccess = function(resp) {
            refreshList(true);
            self.toggleCreate();
            return resp;
        };

        content.createProfile($scope.new)
            .then(onSuccess, uniqueError(reportError))
            .then(this.toggleEdit);
    };

    /**
     * @description Commits the changes made in the editing form for a profile
     * to the server.
     */
    this.update = function() {
        var e = $scope.editing;
        var diff = {};

        Object.keys(e.form).forEach((k) => {
            if (!isEqual(e.form[k], e.original[k])) {
                diff[k] = e.form[k];
            }
        });

        content.updateProfile(e.original, diff)
            .then(refreshList.bind(this, false), reportError)
            .then(this.toggleEdit.bind(this, null));
    };

    /**
     * @description Queries the user for confirmation and deletes the content profile.
     */
    this.delete = function(item) {
        modal.confirm('Are you sure you want to delete this profile?').then(() => {
            content.removeProfile(item)
                .then(refreshList.bind(this, false), reportError)
                .then(this.toggleEdit.bind(this, null));
        });
    };

    refreshList(true);
    setContentProfiles();
}

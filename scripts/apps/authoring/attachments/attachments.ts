import {reactToAngular1} from 'superdesk-ui-framework';

import './attachments.scss';
import {gettext} from 'core/utils';
import AttachmentsEditorDirective from './AttachmentsEditorDirective';
import AttachmentsEditorModalDirective from './AttachmentsEditorModalDirective';

import {
    closeEdit,
    selectFiles,
} from './actions';

import {IAttachment} from '.';
import {AttachmentsList} from './AttachmentsList';

function getFilesLength(state) {
    return state.attachments.files.length;
}

class AttachmentsController {
    closeEdit: () => void;
    selectFiles: (files: Array<File>) => void;

    edit: IAttachment;
    files: Array<IAttachment>;
    maxSize: number;
    maxFiles: number;
    editable: boolean;
    isLocked: boolean;
    isLockedByMe: boolean;

    constructor($scope) {
        const {dispatch} = $scope.store;

        // map dispatch
        this.selectFiles = (files) => dispatch(selectFiles(files));
        this.closeEdit = () => dispatch(closeEdit());

        let state = $scope.store.getState();

        // re-render on state change
        const unsubscribe = $scope.store.subscribe(() => {
            if ($scope.store.getState().attachments !== state.attachments) {
                const filesLengthChange = getFilesLength($scope.store.getState()) !== getFilesLength(state);

                state = $scope.store.getState();
                $scope.$applyAsync(() => {
                    if (filesLengthChange) {
                        $scope.item.attachments = state.attachments.files.map((f) => ({attachment: f._id}));
                        $scope.autosave();
                    }

                    this.mapState($scope.store.getState());
                });
            }
        });

        $scope.$on('$destroy', unsubscribe);

        // init
        this.mapState($scope.store.getState());
    }

    mapState(state) {
        this.edit = state.attachments.edit;
        this.files = state.attachments.files;
        this.maxSize = state.attachments.maxSize;
        this.maxFiles = state.attachments.maxFiles;
        this.editable = state.editor.editable;
        this.isLocked = state.editor.isLocked;
        this.isLockedByMe = state.editor.isLockedByMe;
    }
}

AttachmentsController.$inject = ['$scope'];

AttachmentsFactory.$inject = ['api'];
function AttachmentsFactory(api) {
    const RESOURCE = 'attachments';
    const _byIdCache = {};

    class AttachmentsService {
        /**
         * Get attachments by item
         *
         * @param {Object} item
         * @return {Promise}
         */
        byItem(item) {
            const attachments = item.attachments || [];

            return api.query(RESOURCE, {where: {_id: {$in: attachments.map((ref) => ref.attachment)}}})
                .then((data) => data._items);
        }

        /**
         * Save attachment changes
         *
         * @param {Object} file
         * @param {Object} diff
         * @return {Promise}
         */
        save(file, diff) {
            clearCache(file);
            return api.save(RESOURCE, file, diff);
        }

        /**
         * Remove attachment
         *
         * @param {Object} file
         * @return {Promise}
         */
        remove(file) {
            clearCache(file);
            return api.remove(file);
        }

        /**
         * Get attachment by id
         *
         * @param {String} id
         * @return {Promise}
         */
        byId(id) {
            if (!_byIdCache[id]) {
                _byIdCache[id] = api.find(RESOURCE, id);
            }

            return _byIdCache[id];
        }
    }

    function clearCache(file) {
        if (_byIdCache[file._id]) {
            _byIdCache[file._id] = null;
        }
    }

    return new AttachmentsService();
}

const config = (awp) =>
    awp.widget('attachments', {
        icon: 'attachment',
        label: gettext('Attachments'),
        template: 'scripts/apps/authoring/attachments/attachments.html',
        order: 8,
        side: 'right',
        badge: ['item', (item) => item.attachments && item.attachments.length],
        display: {
            authoring: true,
            packages: true,
            killedItem: true,
            legalArchive: false,
            archived: false,
            picture: true,
            personal: true,
        },
        feature: 'editorAttachments',
    });

angular.module('superdesk.apps.authoring.attachments', [
    'ngFileUpload',
    'superdesk.config',
    'superdesk.core.api',
    'superdesk.apps.authoring.widgets',
])
    .factory('attachments', AttachmentsFactory)
    .controller('AttachmentsCtrl', AttachmentsController)
    .config(['authoringWidgetsProvider', config])
    .directive('sdAttachmentsEditor', AttachmentsEditorDirective)
    .directive('sdAttachmentsEditorModal', AttachmentsEditorModalDirective)
    .component('sdAttachmentsList', reactToAngular1(AttachmentsList, ['store']))
;

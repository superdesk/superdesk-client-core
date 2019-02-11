import './attachments.scss';
import {gettext} from 'core/utils';
import AttachmentsEditorDirective from './AttachmentsEditorDirective';

export {attachments} from './reducer';
export {initAttachments} from './actions';

import {
    removeFile,
    selectFiles,
    editFile,
    saveFile,
    closeEdit,
    download,
} from './actions';

class AttachmentsController {
    constructor($scope) {
        // connect
        this.selectFiles = (files) => $scope.store.dispatch(selectFiles(files));
        this.removeFile = (file) => $scope.store.dispatch(removeFile(file));
        this.editFile = (file) => $scope.store.dispatch(editFile(file));
        this.saveFile = (file, diff) => $scope.store.dispatch(saveFile(file, diff));
        this.closeEdit = () => $scope.store.dispatch(closeEdit());
        this.download = (file) => $scope.store.dispatch(download(file));

        // re-render on change
        $scope.store.subscribe(() => {
            $scope.$applyAsync(() => {
                this.mapStateToCtrl($scope.store.getState());
            });
        });

        // init
        this.mapStateToCtrl($scope.store.getState());
    }

    mapStateToCtrl(state) {
        this.edit = state.attachments.diff;
        this.file = state.attachments.file;
        this.files = state.attachments.files;
        this.maxSize = state.attachments.maxSize;
        this.maxFiles = state.attachments.maxFiles;
        this.isLocked = state.editor.isLocked;
        this.isLockedByMe = state.editor.isLockedByMe;
    }
}

AttachmentsController.$inject = [
    '$scope',
    '$window',
    'superdesk',
    'attachments',
    'notify',
    'urls',
    'lock',
];

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
    'superdesk.core.api',
    'superdesk.apps.authoring.widgets',
])
    .factory('attachments', AttachmentsFactory)
    .controller('AttachmentsCtrl', AttachmentsController)
    .config(['authoringWidgetsProvider', config])
    .directive('sdAttachmentsEditor', AttachmentsEditorDirective)
;

import './attachments.scss';
import {gettext} from 'core/utils';
import AttachmentsEditorDirective from './AttachmentsEditorDirective';
import AttachmentsListDirective from './AttachmentsListDirective';

export {attachments} from './reducer';
export {initAttachments} from './actions';

import {
    selectFiles,
    saveFile,
    closeEdit,
} from './actions';

const mapStateToCtrl = (state) => ({
    edit: state.attachments.diff,
    file: state.attachments.file,
    files: state.attachments.files,
    maxSize: state.attachments.maxSize,
    maxFiles: state.attachments.maxFiles,
    isLocked: state.editor.isLocked,
    isLockedByMe: state.editor.isLockedByMe,
});

const mapDispatchToCtrl = (dispatch) => ({
    selectFiles: (files) => dispatch(selectFiles(files)),
    closeEdit: () => dispatch(closeEdit()),
    saveFile: (file, diff) => dispatch(saveFile(file, diff)),
});

class AttachmentsController {
    constructor($scope) {
        // connect
        Object.assign(this, mapDispatchToCtrl($scope.store.dispatch));

        let state = $scope.store.getState();

        // re-render on change
        const unsubscribe = $scope.store.subscribe(() => {
            if ($scope.store.getState().attachments !== state.attachments) {
                state = $scope.store.getState();
                $scope.$applyAsync(() => {
                    this.mapState($scope.store.getState());
                });
            }
        });

        $scope.$on('$destroy', unsubscribe);

        // init
        this.mapState($scope.store.getState());
    }

    mapState(state) {
        Object.assign(this, mapStateToCtrl(state));
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
    .directive('sdAttachmentsList', AttachmentsListDirective)
;

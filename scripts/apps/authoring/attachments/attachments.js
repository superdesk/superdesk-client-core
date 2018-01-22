import './attachments.scss';

class AttachmentsController {
    constructor($scope, $window, superdesk, attachments, notify, gettext, deployConfig, urls, lock) {
        this.$scope = $scope;
        this.$window = $window;
        this.superdesk = superdesk;
        this.attachments = attachments;
        this.notify = notify;
        this.gettext = gettext;
        this.urls = urls;
        this.isLocked = lock.isLocked($scope.item);
        this.isLockedByMe = lock.isLockedByMe($scope.item);

        attachments.byItem($scope.item).then((files) => {
            this.$scope.files = files;
        }, () => {
            this.$scope.files = [];
        });

        this.maxFiles = deployConfig.getSync('attachments_max_files');
        this.maxSize = deployConfig.getSync('attachments_max_size');
    }

    selectFiles(files) {
        if (Array.isArray(files) && files.length > 0 && !this.isLocked) {
            if (files.length + this.$scope.files.length > this.maxFiles) {
                this.notify.error(this.gettext('Sorry, too many files selected.'));
                return;
            }

            const bigFiles = files.filter((file) => file.size > this.maxSize);

            if (bigFiles.length) {
                this.notify.error(this.gettext('Sorry, but some files are too big.'));
                return;
            }

            this.superdesk
                .intent('upload', 'attachments', files)
                .then(this.addFiles.bind(this));
        }
    }

    addFiles(files) {
        const attachments = this.$scope.item.attachments || [];

        this.$scope.files = this.$scope.files.concat(files);
        this.$scope.item.attachments = attachments.concat(files.map((f) => ({attachment: f._id})));
        this.autosave();
    }

    removeFile(file) {
        this.$scope.files = this.$scope.files.filter((f) => f !== file);
        this.$scope.item.attachments = this.$scope.item.attachments.filter(
            (item) => item.attachment !== file._id
        );
        this.autosave();
    }

    download(file) {
        this.$window.open(this.urls.media(file.media, 'attachments'), '_blank');
    }

    autosave() {
        this.$scope.autosave(this.$scope.item);
    }

    startEdit(file) {
        this.edit = Object.create(file);
        this.file = file;
    }

    saveEdit() {
        this.attachments.save(this.file, this.edit);
        this.closeEdit();
    }

    closeEdit() {
        this.edit = null;
        this.file = null;
    }
}

AttachmentsController.$inject = [
    '$scope',
    '$window',
    'superdesk',
    'attachments',
    'notify',
    'gettext',
    'deployConfig',
    'urls',
    'lock'
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
            personal: true
        }
    });

angular.module('superdesk.apps.authoring.attachments', [
    'ngFileUpload',
    'superdesk.core.api',
    'superdesk.apps.authoring.widgets',
])
    .factory('attachments', AttachmentsFactory)
    .controller('AttachmentsCtrl', AttachmentsController)
    .config(['authoringWidgetsProvider', config]);

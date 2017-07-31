import './attachments.scss';

class AttachmentsController {
    constructor($scope, superdesk, attachments, notify, gettext, deployConfig) {
        this.$scope = $scope;
        this.superdesk = superdesk;
        this.attachments = attachments;
        this.notify = notify;
        this.gettext = gettext;

        attachments.byItem($scope.item).then((files) => {
            this.$scope.files = files;
        }, () => {
            this.$scope.files = [];
        });

        this.maxFiles = deployConfig.getSync('attachments_max_files');
        this.maxSize = deployConfig.getSync('attachments_max_size');
    }

    selectFiles(files) {
        if (Array.isArray(files) && files.length > 0) {
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
        this.attachments.remove(file)
            .then(() => {
                this.$scope.files = this.$scope.files.filter((f) => f !== file);
                this.$scope.item.attachments = this.$scope.item.attachments.filter(
                    (item) => item.attachment !== file._id
                );
                this.autosave();
            });
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

AttachmentsController.$inject = ['$scope', 'superdesk', 'attachments', 'notify', 'gettext', 'deployConfig'];

AttachmentsFactory.$inject = ['api'];
function AttachmentsFactory(api) {
    class AttachmentsService {
        byItem(item) {
            const attachments = item.attachments || [];

            return api.query('attachments', {where: {_id: {$in: attachments.map((ref) => ref.attachment)}}})
                .then((data) => data._items);
        }

        save(file, diff) {
            return api.save('attachments', file, diff);
        }

        remove(file) {
            return api.remove(file);
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

angular.module('superdesk.apps.authoring.attachments', ['superdesk.apps.authoring.widgets', 'ngFileUpload'])
    .factory('attachments', AttachmentsFactory)
    .controller('AttachmentsCtrl', AttachmentsController)
    .config(['authoringWidgetsProvider', config])
    ;

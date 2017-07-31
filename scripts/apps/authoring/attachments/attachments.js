import './attachments.scss';

class AttachmentsController {
    constructor(superdesk, $scope) {
        this.superdesk = superdesk;
        this.$scope = $scope;
    }

    selectFiles(files) {
        if (Array.isArray(files) && files.length > 0) {
            this.superdesk
                .intent('upload', 'attachments', files)
                .then(this.uploadFiles.bind(this));
        }
    }

    uploadFiles(files) {
        Promise.resolve(/* upload to server here */ files)
            .then(
                this.setAttachments(files).bind(this),
                this.notifyError.bind(this)
            );
    }

    setAttachments(files) {
        console.log(files);
        this.$scope.files = files;
    }

    notifyError() {
        /* handle error */
    }
}

AttachmentsController.$inject = ['superdesk', '$scope'];

const config = (awp) =>
    awp.widget('attachments', {
        icon: 'attachment',
        label: gettext('Attachments'),
        template: 'scripts/apps/authoring/attachments/attachments.html',
        order: 8,
        side: 'right',
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
    .controller('AttachmentsCtrl', AttachmentsController)
    .config(['authoringWidgetsProvider', config]);

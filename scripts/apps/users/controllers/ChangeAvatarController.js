ChangeAvatarController.$inject = ['$scope', 'upload', 'session', 'urls', 'betaService', 'gettext', 'notify', 'lodash'];
export function ChangeAvatarController($scope, upload, session, urls, beta, gettext, notify, _) {
    $scope.methods = [
        {id: 'upload', label: gettext('Upload from computer')},
        {id: 'photo', label: gettext('Take a picture')},
        {id: 'globe', label: gettext('Use a Web URL')},
    ];

    beta.isBeta().then((beta) => {
        if (!beta) {
            $scope.methods = _.reject($scope.methods, {beta: true});
        }
    });

    $scope.activate = function(method) {
        $scope.active = method;
        $scope.preview = {};
        $scope.progress = {width: 0};
    };

    $scope.activate($scope.methods[0]);

    $scope.removeImage = function() {
        return $scope.resolve(null);
    };

    $scope.upload = function(config) {
        var form = {};

        form.CropLeft = Math.round(Math.min(config.cords.x, config.cords.x2));
        form.CropRight = Math.round(Math.max(config.cords.x, config.cords.x2));
        form.CropTop = Math.round(Math.min(config.cords.y, config.cords.y2));
        form.CropBottom = Math.round(Math.max(config.cords.y, config.cords.y2));

        if (config.img) {
            form.media = config.img;
        } else if (config.url) {
            form.URL = config.url;
        } else {
            return;
        }

        return urls.resource('upload').then((uploadUrl) => upload.start({
            url: uploadUrl,
            method: 'POST',
            data: form,
        }).then((response) => {
            if (response.data._status === 'ERR') {
                notify.error(gettext('There was a problem with your upload'));
                return;
            }

            var pictureUrl = response.data.renditions.viewImage.href;

            $scope.locals.data.avatar = response.data._id;

            return $scope.resolve(pictureUrl);
        }, (error) => {
            notify.error(error.statusText !== '' ?
                error.statusText :
                gettext('There was a problem with your upload'));
        }, (update) => {
            $scope.progress.width = Math.round(update.loaded / update.total * 100.0);
        }));
    };
}

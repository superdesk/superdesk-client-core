export default function notifySaveError(response, notify) {
    if (angular.isDefined(response.data._issues) &&
            angular.isDefined(response.data._issues['validator exception'])) {
        notify.error(gettext('Error: ' + response.data._issues['validator exception']));
    } else if (angular.isDefined(response.data._issues) &&
            angular.isDefined(response.data._issues.template_name)) {
        notify.error(gettext('Error: ' + response.data._issues.template_name));
    } else if (angular.isDefined(response.data._message)) {
        notify.error(gettext(response.data._message));
    } else {
        notify.error(gettext('Error: Failed to save template.'));
    }
}

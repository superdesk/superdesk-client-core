/**
* Common error handler code for privilege errors
*/
export default function privilegesErrorHandler(response) {
    if (angular.isDefined(response.data._issues) &&
        angular.isDefined(response.data._issues['validator exception'])) {
        return 'Error: ' + response.data._issues['validator exception'];
    } else if (angular.isDefined(response.data._message)) {
        return 'Error: ' + response.data._message;
    }

    return 'Error. Privileges not updated.';
}

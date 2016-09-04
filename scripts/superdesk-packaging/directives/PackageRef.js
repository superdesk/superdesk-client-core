PackageRef.$inject = ['api', '$rootScope'];
export function PackageRef(api, $rootScope) {
    return {
        templateUrl: 'scripts/superdesk-packaging/views/sd-package-ref.html',
        scope: {
            item: '=',
            setitem: '&'
        }
    };
}

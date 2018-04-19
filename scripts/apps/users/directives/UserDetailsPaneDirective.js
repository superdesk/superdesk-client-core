UserDetailsPaneDirective.$inject = ['$timeout'];
export function UserDetailsPaneDirective($timeout) {
    return {
        replace: true,
        transclude: true,
        template: '<div class="user-details-pane" ng-transclude></div>',
        link: function(scope, element, attrs) {
            $timeout(() => {
                $('.user-details-pane').addClass('open');
            }, 0, false);

            scope.closePane = function() {
                $('.user-details-pane').removeClass('open');
            };
        },
    };
}

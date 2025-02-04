UserInfoDirective.$inject = ['userPopup'];
export function UserInfoDirective(userPopup) {
    return {
        link: function(scope, element, attrs) {
            element.addClass('user-link');
            element.hover(() => {
                userPopup.set(attrs.user, element, scope);
            }, () => {
                userPopup.close();
            });
        },
    };
}

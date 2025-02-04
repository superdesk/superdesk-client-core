/**
 * Html5 Source tag doesn't support {{ angular }}
 */
export function Html5vfix() {
    return {
        restrict: 'A',
        link: function(scope, element, attr) {
            attr.$set('src', attr.vsrc);
        },
    };
}

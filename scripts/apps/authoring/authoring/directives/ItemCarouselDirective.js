import 'owl.carousel';

/**
 * @ngdoc directive
 * @module superdesk.apps.authoring
 * @name sdItemCarousel
 *
 * @requires $timeout
 */

ItemCarouselDirective.$inject = ['$timeout'];
export function ItemCarouselDirective($timeout) {
    return {
        scope: {
            items: '='
        },
        transclude: true,
        templateUrl: 'scripts/apps/authoring/views/item-carousel.html',
        link: function(scope, elem) {
            let carousel,
                thumbnailStrip = elem.find('.sd-media-carousel__thumb-strip');

            scope.$watch('items', (items) => {
                if (carousel) {
                    carousel.trigger('destroy.owl.carousel');
                }

                if (items.length > 1) {
                    $timeout(() => {
                        initCarousel();
                    }, 200, false);
                } else {
                    elem.find('.sd-media-carousel__nav-button').hide();
                }
            });

            scope.navNext = () => carousel.trigger('next.owl.carousel');
            scope.navPrev = () => carousel.trigger('prev.owl.carousel');

            scope.goTo = (index) => carousel.trigger('to.owl.carousel', [index]);

            function initCarousel() {
                carousel = elem.find('.sd-media-carousel__content').owlCarousel({
                    items: 1,
                    autoHeight: true,
                    loop: true
                });
            }

            thumbnailStrip.on('dragover', (event) => {
                event.preventDefault();
                event.stopPropagation();
            });

            thumbnailStrip.on('drop dragdrop', (event) => {
                event.preventDefault();
                event.stopPropagation();

                let rel = elem.find('.sd-media-carousel__thumb--add').data('rel');

                scope.$broadcast('init:upload', {files: event, rel: rel});
            });

            scope.upload = () => {
                scope.$broadcast('init:upload');
            };

            scope.$on('$destroy', () => {
                thumbnailStrip.off('drop dragdrop dragover');
            });
        }
    };
}

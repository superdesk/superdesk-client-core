export function ItemRendition() {
    return {
        templateUrl: 'scripts/apps/archive/views/item-rendition.html',
        scope: {
            item: '=',
            rendition: '@',
        },
        link: function(scope, elem, attrs) {
            scope.$watch('item.renditions[rendition].href', (href) => {
                var figure = elem.find('figure'),
                    oldImg = figure.find('img').css('opacity', 0.5);

                if (href) {
                    var img = new Image();

                    img.onload = function() {
                        if (oldImg.length) {
                            oldImg.replaceWith(img);
                        } else {
                            figure.html(img);
                        }

                        if (img.naturalWidth < img.naturalHeight) {
                            elem.addClass('portrait');
                        } else {
                            elem.removeClass('portrait');
                        }
                    };

                    img.onerror = function() {
                        figure.html('');
                    };

                    img.src = href;
                }
            });
        },
    };
}

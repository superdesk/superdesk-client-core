export function ContentExpiry() {
    return {
        templateUrl: 'scripts/apps/desks/views/content-expiry.html',
        scope: {
            item: '=',
            preview: '=',
            header: '@'
        },
        link: function(scope, elem, attrs) {
            var expiryfield = attrs.expiryfield;
            scope.ContentExpiry = {
                Expire: true,
                Days: 0,
                Hours: 0,
                Minutes: 0,
                Header: 'Content Expiry'
            };

            scope.$watch('item', function() {
                setContentExpiry(scope.item);
            });

            scope.$watch('ContentExpiry', function() {
                if (!scope.item) {
                    scope.item = {};
                }

                scope.item[expiryfield] = getTotalExpiryMinutes(scope.ContentExpiry);
            }, true);

            function getExpiryDays(inputMin) {
                return Math.floor(inputMin / (60 * 24));
            }

            function getExpiryHours(inputMin) {
                return Math.floor(inputMin / 60 % 24);
            }

            function getExpiryMinutes(inputMin) {
                return Math.floor(inputMin % 60);
            }

            function getTotalExpiryMinutes(contentExpiry) {
                if (contentExpiry.Expire) {
                    return contentExpiry.Days * 24 * 60 + contentExpiry.Hours * 60 + contentExpiry.Minutes;
                }

                return -1;
            }

            var setContentExpiry = function(item) {
                scope.ContentExpiry.Header = scope.header;
                scope.ContentExpiry.Expire = true;
                scope.ContentExpiry.Days = 0;
                scope.ContentExpiry.Hours = 0;
                scope.ContentExpiry.Minutes = 0;

                if (item && !_.isNil(item[expiryfield])) {
                    if (item[expiryfield] < 0) {
                        scope.ContentExpiry.Expire = false;
                    } else {
                        scope.ContentExpiry.Days = getExpiryDays(item[expiryfield]);
                        scope.ContentExpiry.Hours = getExpiryHours(item[expiryfield]);
                        scope.ContentExpiry.Minutes = getExpiryMinutes(item[expiryfield]);
                    }
                }
            };
        }
    };
}

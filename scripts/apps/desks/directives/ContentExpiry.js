/**
 * @ngdoc directive
 * @module superdesk.apps.desks
 * @name sdContentExpiry
 *
 * @description
 *   This directive is responsible for rendering content expiry for ingest, desk and stages.
 */
export function ContentExpiry() {
    return {
        templateUrl: 'scripts/apps/desks/views/content-expiry.html',
        scope: {
            item: '=',
            preview: '=',
            header: '@',
            expiryMinutes: '=',
            expiryContext: '@',
        },
        link: function(scope, elem, attrs) {
            let expiryfield = attrs.expiryfield;

            scope.contentExpiry = {
                expire: true,
                days: 0,
                hours: 0,
                minutes: 0,
                header: 'Content Expiry',
                actualExpiry: null,
            };

            scope.$watch('item', () => {
                setContentExpiry(scope.item);
            });

            scope.$watch('contentExpiry', () => {
                if (!scope.item) {
                    scope.item = {};
                }

                scope.item[expiryfield] = getTotalExpiryMinutes(scope.contentExpiry);
                getActualExpiry();
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
                if (contentExpiry.expire) {
                    return contentExpiry.days * 24 * 60 + contentExpiry.hours * 60 + contentExpiry.minutes;
                }

                return -1;
            }

            /**
             * @ngdoc method
             * @name sdContentExpiry#getActualExpiry
             * @private
             * @description Calculate the expiry string to display based on the context.
             * The actual expiry is displayed if content expiry is not set.
             */
            function getActualExpiry() {
                // if desk or stage or ingest content expiry then don't calculate.
                if (scope.contentExpiry.expire && (
                    scope.contentExpiry.days > 0 || scope.contentExpiry.hours > 0 ||
                    scope.contentExpiry.minutes > 0)) {
                    scope.contentExpiry.actualExpiry = null;
                    return;
                }

                let days, hours, minutes, expiry = null, text = 'OFF';

                if (scope.expiryMinutes > 0) {
                    days = getExpiryDays(scope.expiryMinutes);
                    hours = getExpiryHours(scope.expiryMinutes);
                    minutes = getExpiryMinutes(scope.expiryMinutes);
                    expiry = `days:${days} hr:${hours} min:${minutes}`;
                    if (scope.preview) {
                        expiry = `(${expiry})`;
                    }
                    text = `Using ${scope.expiryContext} default`;
                }

                scope.contentExpiry.actualExpiry = {
                    text: text,
                    expiry: expiry,
                };
            }

            const setContentExpiry = function(item) {
                scope.contentExpiry.header = scope.header;
                scope.contentExpiry.expire = true;
                scope.contentExpiry.days = 0;
                scope.contentExpiry.hours = 0;
                scope.contentExpiry.minutes = 0;
                scope.contentExpiry.actualExpiry = null;

                if (item && !_.isNil(item[expiryfield])) {
                    if (item[expiryfield] < 0) {
                        scope.contentExpiry.expire = false;
                    } else {
                        scope.contentExpiry.days = getExpiryDays(item[expiryfield]);
                        scope.contentExpiry.hours = getExpiryHours(item[expiryfield]);
                        scope.contentExpiry.minutes = getExpiryMinutes(item[expiryfield]);
                    }
                }
                getActualExpiry();
            };
        },
    };
}

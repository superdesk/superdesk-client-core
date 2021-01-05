import moment from 'moment';
import {gettext} from 'core/utils';

/**
 * @ngdoc controller
 * @module superdesk.apps.publish
 * @name SubscriberTokenController
 * @requires https://docs.angularjs.org/api/ng/type/$rootScope.Scope $scope
 * @requires api
 * @description SubscriberTokenController manages subsriber tokens for Content API.
 */
export function SubscriberTokenController($scope, api, $rootScope) {
    const subscriber = $scope.subscriber;

    this.tokens = [];

    this.getExpiryFields = [
        {days: gettext('1 week'), value: 7},
        {days: gettext('2 weeks'), value: 14},
        {days: gettext('1 month'), value: 30},
        {days: gettext('6 months'), value: 180},
        {days: gettext('1 year'), value: 365},
        {days: gettext('2 years'), value: 730},
        {days: gettext('5 years'), value: 1825},
        {days: gettext('10 years'), value: 3650},
    ];

    const fetchTokens = () => {
        if (subscriber._id) {
            api.query('subscriber_token', {where: {subscriber: subscriber._id}})
                .then((response) => {
                    this.tokens = response._items;
                    $scope.$watchGroup([() => this.tokens.length, () => this.ttl], (newVal, oldVal) => {
                        if (newVal !== oldVal) {
                            $rootScope.$broadcast('subcriber: saveEnabled');
                        }
                    });
                });
        }
    };

    const expiry = (ttl) => moment().utc()
        .add(parseInt(ttl, 10), 'days')
        .format();

    /**
     * @ngdoc method
     * @name SubscriberTokenController#generate
     * @param {string} ttl Token time to live in days.
     * @description Generate new token on server and refresh the list.
     */
    this.generate = (ttl) =>
        api.save('subscriber_token', {
            subscriber: subscriber._id,
            expiry_days: this.neverExpire ? 0 : ttl,
        }).then(fetchTokens);

    /**
     * @ngdoc method
     * @name SubscriberTokenController#revoke
     * @param {Object} token Token object from api.
     * @description Revoke an existing token and refresh the list.
     */
    this.revoke = (token) =>
        api.remove(token).then(fetchTokens);

    /**
     * @ngdoc property
     * @name SubscriberTokenController#ttl
     * @type {string}
     * @description Default time to live value for new tokens.
     */
    this.ttl = '7'; // default ttl

    this.neverExpire = false;

    // init
    fetchTokens();
}

SubscriberTokenController.$inject = ['$scope', 'api', '$rootScope'];

import moment from 'moment';

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

    this.days = {
        '1 week': 7,
        '2 weeks': 14,
        '1 month': 30,
        '6 months': 180,
        '1 year': 365,
        '2 years': 730,
        '5 years': 1825,
        '10 years': 3650,
    };

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
            expiry: !this.neverExpire ? expiry(ttl) : null,
            never_expire: this.neverExpire,
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

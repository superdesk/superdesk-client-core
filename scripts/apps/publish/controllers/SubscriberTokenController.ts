import moment from 'moment';

/**
 * @ngdoc controller
 * @module superdesk.apps.publish
 * @name SubscriberTokenController
 * @requires https://docs.angularjs.org/api/ng/type/$rootScope.Scope $scope
 * @requires api
 * @description SubscriberTokenController manages subsriber tokens for Content API.
 */
export function SubscriberTokenController($scope, api) {
    const subscriber = $scope.subscriber;

    this.tokens = [];

    const fetchTokens = () => {
        if (subscriber._id) {
            api.query('subscriber_token', {where: {subscriber: subscriber._id}})
                .then((response) => {
                    this.tokens = response._items;
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
        api.save('subscriber_token', {subscriber: subscriber._id, expiry: expiry(ttl)})
            .then(fetchTokens);

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

    // init
    fetchTokens();
}

SubscriberTokenController.$inject = ['$scope', 'api'];

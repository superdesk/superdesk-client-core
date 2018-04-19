/**
 * @ngdoc controller
 * @module superdesk.apps.ingest
 * @name ExternalSourceController
 *
 * @requires api
 * @requires data
 * @requires desks
 * @requires notify
 * @requires gettext
 *
 * @description
 *   This controller fetches the item from external source ( like AAP Multimedia, Scanpix) into Superdesk.
 */
ExternalSourceController.$inject = ['api', 'data', 'desks', 'notify', 'gettext'];
export function ExternalSourceController(api, data, desks, notify, gettext) {
    return api.save(data.item.fetch_endpoint, {
        guid: data.item.guid,
        desk: desks.getCurrentDeskId(),
    }, null, null, {repo: data.item.ingest_provider})
        .then((response) => {
            data.item = response;
            data.item.actioning = angular.extend({}, data.item.actioning, {externalsource: false});
            notify.success(gettext('Item Fetched.'));
            return data.item;
        }, (error) => {
            data.item.error = error;
            notify.error(gettext('Failed to get item.'));
            return data.item;
        });
}
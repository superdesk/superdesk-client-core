ExternalSourceController.$inject = ['api', 'data', 'desks'];
export function ExternalSourceController(api, data, desks) {
    return desks.fetchCurrentDeskId().then(function(deskid) {
        return api(data.item.fetch_endpoint).save({
            guid: data.item.guid,
            desk: deskid
        })
        .then(function(response) {
            data.item = response;
            data.item.actioning = angular.extend({}, data.item.actioning, {externalsource: false});
            return data.item;
        }, function errorHandler(error) {
            data.item.error = error;
            return data.item;
        });
    });
}

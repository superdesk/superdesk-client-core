ExternalSourceController.$inject = ['api', 'data', 'desks'];
export function ExternalSourceController(api, data, desks) {
    return desks.fetchCurrentDeskId()
        .then((deskid) =>
            api(data.item.fetch_endpoint).save({
                guid: data.item.guid,
                desk: deskid,
                repo: data.item.ingest_provider || null
            })
            .then((response) => {
                data.item = response;
                data.item.actioning = angular.extend({}, data.item.actioning, {externalsource: false});
                return data.item;
            }, (error) => {
                data.item.error = error;
                return data.item;
            })
        );
}

FamilyService.$inject = ['api', 'desks'];

export function FamilyService(api, desks) {
    const repo = 'archive,published';

    this.fetchItems = (familyId, excludeItem) => {
        var filter = [
            {not: {term: {state: 'spiked'}}},
            {term: {family_id: familyId}}
        ];

        if (excludeItem) {
            filter.push({not: {term: {unique_id: excludeItem.unique_id}}});
        }

        return query(filter, 'versioncreated', 'desc');
    };

    const query = (filter, sortField, order) => {
        let params = {
            repo: repo,
            source: {
                query: {filtered: {filter: {
                    and: filter
                }}},
                size: 200,
                from: 0
            }
        };

        params.source.sort = {};
        params.source.sort[sortField] = order;
        return api('search').query(params);
    };

    this.fetchRelatedItems = (eventId, familyId) => {
        var filter = [
            {not: {term: {state: 'spiked'}}},
            {term: {event_id: eventId}},
            {not: {term: {type: 'composite'}}}
        ];

        return query(filter, 'firstcreated', 'asc');
    };

    this.fetchDesks = (item, excludeSelf) => this.fetchItems(item.state === 'ingested' ?
        item._id : item.family_id, excludeSelf ? item : undefined)
        .then((items) => {
            var deskList = [];
            var deskIdList = [];

            _.each(items._items, (i) => {
                if (i.task && i.task.desk && desks.deskLookup[i.task.desk]) {
                    if (deskIdList.indexOf(i.task.desk) < 0) {
                        var _isMember = !_.isEmpty(_.find(desks.userDesks, {_id: i.task.desk}));

                        deskList.push(
                            {
                                desk: desks.deskLookup[i.task.desk],
                                count: 1,
                                itemId: i._id,
                                isUserDeskMember: _isMember,
                                item: i
                            });
                        deskIdList.push(i.task.desk);
                    } else {
                        deskList[deskIdList.indexOf(i.task.desk)].count += 1;
                    }
                }
            });
            return deskList;
        });
}
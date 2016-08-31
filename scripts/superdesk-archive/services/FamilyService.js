FamilyService.$inject = ['api', 'desks'];

export function FamilyService(api, desks) {
    this.fetchItems = function(familyId, excludeItem) {
        var repo = 'archive,published';

        var filter = [
            {not: {term: {state: 'spiked'}}},
            {term: {family_id: familyId}}
        ];

        if (excludeItem) {
            filter.push({not: {term: {unique_id: excludeItem.unique_id}}});
        }

        return api('search').query({
            repo: repo,
            source: {
                query: {filtered: {filter: {
                    and: filter
                }}},
                sort: [{versioncreated: 'desc'}],
                size: 100,
                from: 0
            }
        });
    };
    this.fetchDesks = function(item, excludeSelf) {
        return this.fetchItems(item.state === 'ingested' ? item._id : item.family_id, excludeSelf ? item : undefined)
        .then(function(items) {
            var deskList = [];
            var deskIdList = []; _.each(items._items, function(i) {
                if (i.task && i.task.desk && desks.deskLookup[i.task.desk]) {
                    if (deskIdList.indexOf(i.task.desk) < 0) {
                        var _isMember = !_.isEmpty(_.find(desks.userDesks._items, {_id: i.task.desk}));
                        deskList.push(
                            {
                                'desk': desks.deskLookup[i.task.desk],
                                'count': 1,
                                'itemId': i._id,
                                'isUserDeskMember': _isMember,
                                'item': i
                            });
                        deskIdList.push(i.task.desk);
                    } else {
                        deskList[deskIdList.indexOf(i.task.desk)].count += 1;
                    }
                }
            });
            return deskList;
        });
    };
}

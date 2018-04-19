SubjectService.$inject = ['api'];
export function SubjectService(api) {
    var service = {
        rawSubjects: null,
        qcodeLookup: {},
        subjects: [],
        fetched: null,
        fetchSubjects: function() {
            var self = this;

            return api.get('/subjectcodes')
                .then((result) => {
                    self.rawSubjects = result;
                });
        },
        process: function() {
            var self = this;

            _.each(this.rawSubjects._items, (item) => {
                self.qcodeLookup[item.qcode] = item;
            });
            _.each(this.rawSubjects._items, (item) => {
                self.subjects.push({qcode: item.qcode, name: item.name, path: self.getPath(item)});
            });

            return this.subjects;
        },
        getPath: function(item) {
            var path = '';

            if (item.parent) {
                path = this.getPath(this.qcodeLookup[item.parent]) + this.qcodeLookup[item.parent].name + ' / ';
            }
            return path;
        },
        initialize: function() {
            if (!this.fetched) {
                this.fetched = this.fetchSubjects()
                    .then(angular.bind(this, this.process));
            }
            return this.fetched;
        },
    };

    return service;
}

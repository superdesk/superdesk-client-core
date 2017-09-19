DictionaryService.$inject = ['api', 'urls', 'session', 'Upload', '$q'];
export function DictionaryService(api, urls, session, Upload, $q) {
    this.dictionaries = null;
    this.currDictionary = null;

    this.getActive = getActive;
    this.getUserDictionary = getUserDictionary;
    this.addWordToUserDictionary = addWordToUserDictionary;
    this.getUserAbbreviations = getUserAbbreviations;

    function setPersonalName(data) {
        if (data.user) {
            data.name = data.user + ':' + data.language_id;
        }
    }

    this.fetch = function(success, error) {
        return session.getIdentity().then((identity) => api.query('dictionaries', {
            projection: {content: 0},
            where: {
                $or: [
                    {user: {$exists: false}},
                    {user: identity._id}
                ]}
        })
            .then(success, error));
    };

    this.open = function(dictionary, success, error) {
        return api.find('dictionaries', dictionary._id).then(success, error);
    };

    this.upload = function(dictionary, data, file, success, error, progress) {
        var hasId = _.has(dictionary, '_id') && dictionary._id !== null;
        var method = hasId ? 'PATCH' : 'POST';
        var headers = hasId ? {'If-Match': dictionary._etag} : {};
        var sendData = {};

        // pick own properties
        angular.forEach(data, (val, key) => {
            if (key !== 'content' && key[0] !== '_') {
                sendData[key] = val === null ? val : val.toString();
            }
        });
        setPersonalName(sendData);

        // send content as content_list which will accept string and will json.parse it later
        // (we send it as form data so each field is not parsed and it would fail list validation)
        if (data.hasOwnProperty('content')) {
            sendData.content_list = angular.toJson(data.content);
        }

        urls.resource('dictionaries').then((uploadURL) => {
            let url = uploadURL;

            if (hasId) {
                url += '/' + dictionary._id;
            }

            return Upload.upload({
                url: url,
                method: method,
                data: sendData,
                file: file,
                headers: headers
            }).then(success, error, progress);
        }, error);
    };

    this.update = function(dictionary, data, success, error) {
        var sendData = {};

        angular.forEach(data, (val, key) => {
            if (key[0] !== '_') {
                sendData[key] = key === 'is_active' ? val.toString() : val;
            }
        });

        setPersonalName(sendData);
        return api.save('dictionaries', dictionary, sendData).then(success, error);
    };

    this.remove = function(dictionary, success, error) {
        return api.remove(dictionary).then(success, error);
    };

    this.isAbbreviationsDictionary = function(dict) {
        return dict && dict.type === 'abbreviations';
    };

    /**
     * Get list of active abbreviations for given lang
     *
     * @param {string} lang
     */
    function getUserAbbreviations(lang, baseLang) {
        return session.getIdentity().then((identity) => {
            var languageIds = [{language_id: lang}];

            if (baseLang) {
                languageIds.push({language_id: baseLang});
            }

            return api.query('dictionaries', {
                where: {$and:
                [{$or: languageIds},
                    {is_active: 'true'},
                    {type: 'abbreviations'},
                    {user: identity._id}]
                }}).then((items) => items._items);
        });
    }

    /**
     * Get list of active dictionaries for given lang
     *
     * @param {string} lang
     */
    function getActive(lang, baseLang) {
        return session.getIdentity().then((identity) => {
            var languageIds = [{language_id: lang}];

            if (baseLang) {
                languageIds.push({language_id: baseLang});
            }

            return api.query('dictionaries', {
                projection: {content: 0},
                where: {$and:
                [{$or: languageIds},
                    {is_active: {$in: ['true', null]}},
                    {$or: [{type: {$exists: 0}}, {type: 'dictionary'}]},
                    {$or: [{user: identity._id}, {user: {$exists: false}}]}]
                }}).then((items) => $q.all(items._items.map(fetchItem)));
        });

        function fetchItem(item) {
            return api.find('dictionaries', item._id);
        }
    }

    /**
     * Get user dictionary for given language
     *
     * @param {string} lang
     */
    function getUserDictionary(lang) {
        return session.getIdentity().then((identity) => {
            var where = {
                where: {
                    $and: [
                        {language_id: lang}, {user: identity._id},
                        {$or: [{type: {$exists: 0}}, {type: 'dictionary'}]}
                    ]
                }
            };

            return api.query('dictionaries', where)
                .then((response) => response._items.length ? response._items[0] : {
                    name: identity._id + ':' + lang,
                    content: {},
                    language_id: lang,
                    user: identity._id
                });
        });
    }

    /**
     * Add word to user dictionary
     *
     * @param {string} word
     * @param {string} lang
     */
    function addWordToUserDictionary(word, lang) {
        return getUserDictionary(lang).then((userDict) => {
            var words = userDict.content || '{}';

            if (_.isString(words)) {
                words = JSON.parse(userDict.content || '{}');
            }

            words[word] = words[word] ? words[word] + 1 : 1;
            userDict.content = words;
            return api.save('dictionaries', userDict);
        });
    }
}

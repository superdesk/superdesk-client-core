import _ from 'lodash';

class LinkFunction {
    api: any;
    config: any;
    multi: any;
    notify: any;
    storage: any;
    session: any;
    urls: any;
    scope: any;

    constructor(api, config, multi, notify, storage, session, urls, scope) {
        this.api = api;
        this.config = config;
        this.multi = multi;
        this.notify = notify;
        this.storage = storage;
        this.session = session;
        this.urls = urls;
        this.scope = scope;

        this.init();
    }

    /**
     * @ngdoc method
     * @name sdExport#init
     * @private
     * @description Initializes the directive with default values for the scope
     */
    init() {
        this.scope.loading = false;
        this.scope.selectedFormatter = this.storage.getItem('selectedFormatter');
        this.scope.validate = false;
        this.scope.exportFile = this.exportFile.bind(this);
        this.scope.cancel = this.cancel.bind(this);
        this.scope.failures = 0;
        this.scope.error = false;
        this.scope.err_msg = null;

        this.api.query('formatters', {criteria: 'can_export'}).then((result) => {
            this.scope.exportFormatters = result._items;
            if (!this.scope.selectedFormatter &&
                    this.scope.exportFormatters.length > 0) {
                this.scope.selectedFormatter = JSON.stringify(this.scope.exportFormatters[0]);
            }
        });
    }

    /**
     * @ngdoc method
     * @name sdExport#cancel
     * @private
     * @description Closes the Export modal dialog
     */
    cancel() {
        this.scope.closeExport();
    }

    /**
     * @ngdoc method
     * @name sdExport#exportFile
     * @private
     * @param {string} formatterString - name of the formatter selected
     * @param {Boolean} validate - item to be validated for publish action
     * @description Calls 'export' endpoint with the request and downloads file if export was successful
     * @return {Promise}
     */
    exportFile(formatterString, validate) {
        this.scope.loading = true;
        this.storage.setItem('selectedFormatter', formatterString);
        let formatter = JSON.parse(formatterString);
        let itemIdList = this.scope.multi ? _.map(this.multi.getItems(), '_id') : [this.scope.item._id];

        return this.api.save('export', {}, {item_ids: itemIdList, format_type: formatter.name, validate: validate})
            .then((item) => {
                this.scope.failures = item.failures;
                // Click the url to triger download of file
                if (item.url) {
                    let elem = $('#exportDownloadLink');

                    if (elem[0]) {
                        elem[0].href = item.url;
                        elem[0].click();
                    }

                    if (this.scope.failures === 0) {
                        this.scope.closeExport();
                    }
                }
            }, (error) => {
                this.onError(error.data._message);
            })
            .finally(() => {
                this.scope.loading = false;
            });
    }

    /**
     * @ngdoc method
     * @name sdExport#onError
     * @private
     * @param {string} msg - error msg to be displayed
     * @description Set error indicating variables
     */
    onError(msg) {
        this.scope.error = true;
        this.scope.err_msg = msg;
    }
}

/**
 * @module superdesk.apps.archive
 * @ngdoc directive
 * @name sdExport
 * @requires api
 * @requires config
 * @requires multi
 * @requires notify
 * @requires storage
 * @requires session
 * @requires urls
 * @description This directive is used to export articles in selected formats and download the exported file
 *
 */
export function Export(api, config, multi, notify, storage, session, urls) {
    return {
        templateUrl: 'scripts/apps/archive/views/export.html',
        link: (scope) => new LinkFunction(api, config, multi, notify, storage, session, urls, scope),
    };
}

Export.$inject = ['api', 'config', 'multi', 'notify', 'storage', 'session', 'urls'];

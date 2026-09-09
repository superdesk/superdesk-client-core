import _ from 'lodash';

class LinkFunction {
    api: any;
    multi: any;
    notify: any;
    storage: any;
    session: any;
    urls: any;
    scope: any;

    constructor(api, multi, notify, storage, session, urls, scope) {
        this.api = api;
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

        let itemIdList = this.scope.itemsForExport
            ?? (this.scope.multi ? _.map(this.multi.getItems(), '_id') : [this.scope.item._id]);

        return this.api.save('export', {}, {item_ids: itemIdList, format_type: formatter.name, validate: validate})
            .then((item) => {
                this.scope.failures = item.failures;
                if (item.url) {
                    return this.downloadFile(item.url).then(() => {
                        if (this.scope.failures === 0) {
                            this.scope.closeExport();
                        }
                    });
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
     * @name sdExport#downloadFile
     * @private
     * @param {string} url - url of the exported file
     * @description Downloads the file as a blob to avoid a top-level navigation,
     * which in Firefox tears down the notification websocket. Falls back to a
     * direct link click if the file can't be fetched (e.g. cross-origin in dev).
     * @return {Promise}
     */
    downloadFile(url) {
        return fetch(url)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Export download failed');
                }
                return response.blob();
            })
            .then((blob) => {
                const objectUrl = window.URL.createObjectURL(blob);
                const elem = document.createElement('a');

                elem.href = objectUrl;
                elem.download = 'export.zip';
                document.body.appendChild(elem);
                elem.click();
                document.body.removeChild(elem);
                window.URL.revokeObjectURL(objectUrl);
            })
            .catch(() => {
                const elem = $('#exportDownloadLink');

                if (elem[0]) {
                    elem[0].href = url;
                    elem[0].click();
                }
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
export function Export(api, multi, notify, storage, session, urls) {
    return {
        templateUrl: 'scripts/apps/archive/views/export.html',
        link: (scope) => new LinkFunction(api, multi, notify, storage, session, urls, scope),
    };
}

Export.$inject = ['api', 'multi', 'notify', 'storage', 'session', 'urls'];

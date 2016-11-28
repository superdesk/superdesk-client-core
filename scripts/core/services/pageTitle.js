/**
 * @ngdoc service
 * @module superdesk.core.services
 * @name pageTitle
 *
 * @description
 * PageTitle service
 *
 * PageTitle service is used to save and update the title of the page.
 * The title will be 'Superdesk {- Url} {-Desk/Workspace}
 * Url can be: Dashboard, Monitoring, Spike, Highlights, Search, Settings
 * If Url is search then there won't be desk
 */
export default angular.module('superdesk.core.services.pageTitle', [])
    .service('pageTitle', function() {
        this.title = 'Superdesk';
        this.url = '';
        this.workspace = '';

        this.setUrl = function(url) {
            this.url = url;
            setTitle(this.url, this.workspace);
        };

        this.setWorkspace = function(activeWorkspace) {
            this.workspace = activeWorkspace;
            setTitle(this.url, this.workspace);
        };

        function setTitle(url, activeWorkspace) {
            document.title = 'Superdesk' + (url ? ' - ' + url : '') + (activeWorkspace ? ' - ' + activeWorkspace : '');
        }

        this.clear = function() {
            document.title = this.title;
        };
    });

/**
 * PageTitle service
 *
 * PageTitle service is used to save and update the title of the page.
 * The title will be 'Superdesk {- Url} {-Desk/Workspace}
 * Url can be: Dashboard, Monitoring, Spike, Highlights, Search, Settings
 * If Url is search then there won't be desk
 *
 */
export default angular.module('superdesk.services.pageTitle', [])
    .service('pageTitle', function() {
        this.title = 'Superdesk';
        this.url = '';
        this.workspace = '';

        this.setPageUrl = function(url) {
            this.url = url;
            setPageTitle(this.url, this.workspace);
        };

        this.setPageWorkspace = function(activeWorkspace) {
            this.workspace = activeWorkspace;
            setPageTitle(this.url, this.workspace);
        };

        function setPageTitle(url, activeWorkspace) {
            document.title = 'Superdesk' + (url?' - ' + url:'') + (activeWorkspace?' - ' + activeWorkspace:'');
        }

        this.clearPageTitle = function() {
            document.title = this.title ;
        };
    });

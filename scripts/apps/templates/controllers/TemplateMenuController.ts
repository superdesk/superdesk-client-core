TemplateMenuController.$inject = ['$modal'];
export function TemplateMenuController($modal) {
    this.create = createFromItem;
    function createFromItem(item) {
        $modal.open({
            templateUrl: 'scripts/apps/templates/views/create-template.html',
            controller: 'CreateTemplateController',
            controllerAs: 'template',
            resolve: {
                item: function() {
                    return item;
                },
            },
        });
    }
}

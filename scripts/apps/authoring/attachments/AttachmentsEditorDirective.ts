
export default function AttachmentsEditorDirective() {
    return {
        templateUrl: 'scripts/apps/authoring/attachments/attachments.html',
        link: function(scope, elem, attrs, controllers) {
            scope.attachmentsInAuthoring = true;

            if (attrs.readOnly != null) {
                scope.$watch(attrs.readOnly, (value) => {
                    // can't use bindings since creating an isolate scope would make some variables inaccessible
                    scope.readOnly = value;
                });
            }
        },
    };
}

import {getAnnotationsFromItem} from 'core/editor3/helpers/editor3CustomData';
import {META_FIELD_NAME} from 'core/editor3/helpers/fieldsMeta';
import ng from 'core/services/ng';

function getAnnotationTypesAsync(scope) {
    ng.get('metadata').initialize()
        .then(() => {
            const annotationTypes = ng.get('metadata').values.annotation_types;

            // Use label instead of qcode
            scope.annotations = scope.annotations.map((a) => ({
                ...a,
                type_label: gettext(annotationTypes.find((t) => t.qcode === a.type).name),
            }));
        });
}

function getAllAnnotations(item) {
    const annotations = [];

    for (const field in item[META_FIELD_NAME]) {
        annotations.push(...getAnnotationsFromItem(item, field));
    }

    return annotations;
}

function annotationDecorator() {
    document.querySelectorAll('span[annotation-id]').forEach((elem) => {
        const id = parseInt(elem.getAttribute('annotation-id'), 10);

        if (!document.querySelectorAll(`#annotation-id-${id}`).length) {
            elem.classList.add('annotation-text');
            elem.innerHTML += `<sup class="annotation-id" id="annotation-id-${id}">${id}</sup>`;
        }
    });
}

function afterRender() {
    annotationDecorator();
}

HtmlPreview.$inject = ['$sce', '$timeout'];
export function HtmlPreview($sce, $timeout) {
    return {
        scope: {
            sdHtmlPreview: '=',
            item: '=?',
        },
        templateUrl: 'scripts/apps/archive/views/html-preview.html',
        link: function(scope, elem, attrs) {
            scope.$watch('sdHtmlPreview', (html) => {
                scope.html = $sce.trustAsHtml(html);

                if (window.hasOwnProperty('instgrm')) {
                    window.instgrm.Embeds.process();
                }
            });

            scope.$watch('item', (item) => {
                if (item) {
                    const annotations = getAllAnnotations(item);

                    scope.annotations = annotations.map((a) => ({
                        ...a,
                        body: $sce.trustAsHtml(a.body),
                    }));

                    getAnnotationTypesAsync(scope);
                }
            });

            $timeout(afterRender);
        },
    };
}

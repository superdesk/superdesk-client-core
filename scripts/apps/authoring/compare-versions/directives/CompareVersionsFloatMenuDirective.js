class LinkFunction {
    constructor($document, scope, elem) {
        this.$document = $document;
        this.scope = scope;
        this.elem = elem;

        this.init();
    }

    /**
     * @ngdoc method
     * @name sdCompareVersionsFloatMenu#init
     * @private
     * @description Initializes the directive with default values for the scope
     * and with necessary watchers.
     */
    init() {
        this.open = false;

        this.elem.bind('click', this.toggle.bind(this));

        this.$document.bind('click', this.closeOnClick);

        this.scope.$on('$destroy', () => {
            this.$document.unbind('click', this.closeOnClick);
            this.elem.unbind('click');
        });
    }

    /**
     * @ngdoc method
     * @name sdCompareVersionsFloatMenu#toggle
     * @private
     * @description Toggles the visibility of floating inner dropdown menu element.
     */
    toggle() {
        if (!this.open) {
            event.preventDefault();
            event.stopPropagation();
            $('#compare-versions-float')
                .css(this.getPosition(event.pageX, event.pageY))
                .show();
        } else {
            $('#compare-versions-float').hide();
        }
        this.open = !this.open;
    }

    /**
     * @ngdoc method
     * @name sdCompareVersionsFloatMenu#closeOnClick
     * @private
     * @description hides the floating inner dropdown menu element
     */
    closeOnClick() {
        this.open = false;
        $('#compare-versions-float').hide();
    }

    /**
     * @ngdoc method
     * @name sdCompareVersionsFloatMenu#getPosition
     * @private
     * @param {Integer} crdL - horizontal coordinates of the mouse pointer w.r.t whole document i.e pageX
     * @param {Integer} crdT - verticle coordinates of the mouse pointer w.r.t whole document i.e pageY
     * @description provides the css position for floating inner dropdown menu element to display
     */
    getPosition(crdL, crdT) {
        let docHeight = this.$document.height();
        let docWidth = this.$document.width();
        let position = {
            right: docWidth - crdL
        };

        if (docHeight - crdT < 400) {
            position.bottom = docHeight - crdT;
            position.top = 'auto';
        } else {
            position.top = crdT;
            position.bottom = 'auto';
        }
        return position;
    }
}

/**
 * @ngdoc directive
 * @module superdesk.apps.authoring.compare_versions
 * @name sdCompareVersionsFloatMenu
 * @requires $document
 * @description Floats right in compare-versions screen besides opened boards and on mouse click it displays
 * the list of un-selected versions available to open in new board.
 */
export function CompareVersionsFloatMenuDirective($document) {
    return {
        link: (scope, elem) => new LinkFunction($document, scope, elem)
    };
}

CompareVersionsFloatMenuDirective.$inject = ['$document'];

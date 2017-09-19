angular.module('superdesk.apps.editor2.content', []).directive('sdAddContent', ['$window',
    function($window) {
        return {
        // the scope is not isolated because we require the medium instance
            controller: AddContentCtrl,
            require: ['sdAddContent', '^sdTextEditorBlockText', '^sdTextEditor'],
            templateUrl: 'scripts/core/editor2/views/add-content.html',
            controllerAs: 'vm',
            bindToController: true,
            link: function(scope, element, attrs, ctrls) {
                var vm = ctrls[0];

                angular.extend(vm, {
                    textBlockCtrl: ctrls[1],
                    sdEditorCtrl: ctrls[2]
                });
                if (!vm.config.embeds) {
                    return;
                }
                // initialize state
                vm.updateState();
                // listen for update state signals
                var unbindListener = scope.$parent.$on('sdAddContent::updateState',
                    (signal, event, editorElem) => {
                        vm.updateState(event, editorElem);
                    });
                // update on resize

                angular.element($window).on('resize', vm.updateState);
                scope.$on('$destroy', () => {
                    angular.element($window).off('resize', vm.updateState);
                    unbindListener();
                });
            }
        };
    }]);

AddContentCtrl.$inject = ['$scope', '$element', 'superdesk', 'editor', '$timeout', 'config', '$q'];
function AddContentCtrl(scope, element, superdesk, editor, $timeout, config, $q) {
    var elementHolder = element.find('div:first-child').first();
    var self = this;

    /** Return true if the event come from this directive's element */
    function elementContainsEventTarget(event) {
        if (!angular.isDefined(event)) {
            return false;
        }
        return $.contains(element.get(0), event.target);
    }

    angular.extend(self, {
        expanded: false,
        config: angular.extend({embeds: true}, config.editor || {}), // should be on by default
        // update the (+) vertical position on the left and his visibility (hidden/shown)
        updateState: function(event, editorElem) {
            // hide if medium is not defined yett (can happen at initialization) or
            // hide if the text input is not selected and if it was not a click on the (+) button
            if (!angular.isDefined(scope.medium)
                || !angular.element(editorElem).is(':focus') && !elementContainsEventTarget(event)) {
                return self.hide();
            }

            var currentParagraph;

            try {
                currentParagraph = angular.element(scope.medium.getSelectedParentElement());
            } catch (e) {
                return;
            }
            var position = currentParagraph.position().top;
            // move the (+) button at the caret position

            elementHolder.css('top', position > 0 ? position : 0);
            // handle resize: Do nothing, only positioning was needed
            if (event && event.type === 'resize') {
                return;
            }

            let isFocusEvent = event && event.type === 'focus';
            let isClickEvent = event && event.type === 'click';
            let containsTarget = elementContainsEventTarget(event) && currentParagraph.text() === '';
            let isFocused = editorElem.is(':focus') && currentParagraph.text() === '';
            let isEmptyLine = currentParagraph.text() === '';
            let shouldShow = isFocusEvent && containsTarget || isClickEvent && isFocused || isEmptyLine;

            return shouldShow ? self.show() : self.hide();
        },
        hide: function() {
            $timeout(() => {
                elementHolder.css({
                    display: 'none'
                });
                self.expanded = false;
            });
        },
        show: function() {
            $timeout(() => {
                elementHolder.css({
                    display: 'block'
                });
            });
        },
        toogleExpand: function() {
            self.expanded = !self.expanded;
        },
        isSomethingInClipboard: function() {
            return angular.isDefined(self.sdEditorCtrl.getCutBlock());
        },
        triggerAction: function(action) {
            self.hide();
            self.actions[action]();
        },
        actions: {
            addEmbed: function() {
                self.sdEditorCtrl.splitAndInsert(self.textBlockCtrl).then(() => {
                    // show the add-embed form
                    self.textBlockCtrl.block.showAndFocusLowerAddAnEmbedBox();
                });
            },
            addPicture: function() {
                superdesk.intent('upload', 'media').then((images) => {
                    $q.all(images.map((image) => editor.generateMediaTag(image).then((imgTag) => ({
                        blockType: 'embed',
                        embedType: 'Image',
                        body: imgTag,
                        caption: image.description_text,
                        association: image
                    })))).then((renderedImages) => {
                        self.sdEditorCtrl.splitAndInsert(self.textBlockCtrl, renderedImages);
                    });
                }, () => {
                    scope.node.focus();
                    self.textBlockCtrl.restoreSelection();
                });
            },
            pasteBlock: function() {
                if (!self.sdEditorCtrl.getCutBlock()) {
                    return false;
                }
                self.sdEditorCtrl.splitAndInsert(self.textBlockCtrl, self.sdEditorCtrl.getCutBlock(true));
            }
        }
    });
}

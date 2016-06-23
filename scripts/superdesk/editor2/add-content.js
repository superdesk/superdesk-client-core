(function() {
'use strict';

angular.module('superdesk.editor2.content', []).directive('sdAddContent', ['$window',
function($window) {
    return {
        // the scope is not isolated because we require the medium instance
        controller: AddContentCtrl,
        require: ['sdAddContent', '^sdTextEditorBlockText', '^sdTextEditor'],
        templateUrl: 'scripts/superdesk/editor2/views/add-content.html',
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
            var unbindListener = scope.$parent.$on('sdAddContent::updateState', function(signal, event, editorElem) {
                vm.updateState(event, editorElem);
            });
            // update on resize
            angular.element($window).on('resize', vm.updateState);
            scope.$on('$destroy', function() {
                angular.element($window).off('resize', vm.updateState);
                unbindListener();
            });
        }
    };
}]);

AddContentCtrl.$inject = ['$scope', '$element', 'superdesk', 'editor', '$timeout', 'config'];
function AddContentCtrl (scope, element, superdesk, editor, $timeout, config) {
    var elementHolder = element.find('div:first-child').first();
    var vm = this;
    var caretPosition = null;
    angular.extend(vm, {
        expanded: false,
        config: angular.extend({embeds: true}, config.editor || {}), // should be on by default
        // update the (+) vertical position on the left and his visibility (hidden/shown)
        updateState: function(event, editorElem) {
            /** Return true if the event come from this directive's element */
            function elementContainsEventTarget(elm) {
                if (!angular.isDefined(event)) {
                    return false;
                }
                return $.contains(elm || element.get(0), event.target);
            }
            // hide if medium is not defined yett (can happen at initialization)
            if (!angular.isDefined(scope.medium)) {
                return vm.hide();
            }
            // hide if the text input is not selected and if it was not a click on the (+) button
            if (!angular.element(editorElem).is(':focus') && !elementContainsEventTarget()) {
                return vm.hide();
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
            // handle focus changes: show (+) if current element has been focused
            if (event && event.type === 'focus') {
                if (elementContainsEventTarget() && currentParagraph.text() === '') {
                    return vm.show();
                } else {
                    return vm.hide();
                }
            }
            // handle click: show (+) if editor is focused
            if (event && event.type === 'click') {
                if (editorElem.is(':focus') && currentParagraph.text() === '') {
                    return vm.show();
                } else {
                    return vm.hide();
                }
            }
            // default rules, show (+) if line is empty
            if (currentParagraph.text() === '') {
                return vm.show();
            } else {
                return vm.hide();
            }
        },
        hide: function() {
            $timeout(function() {
                elementHolder.css({
                    'display': 'none'
                });
                vm.expanded = false;
            });
        },
        show: function() {
            $timeout(function() {
                elementHolder.css({
                    'display': 'block'
                });
            });
        },
        toogleExpand: function() {
            caretPosition = scope.medium.exportSelection();
            vm.expanded = !vm.expanded;
        },
        isSomethingInClipboard: function() {
            return angular.isDefined(vm.sdEditorCtrl.getCutBlock());
        },
        triggerAction: function(action) {
            vm.hide();
            vm.actions[action]();
        },
        actions: {
            addEmbed: function() {
                var indexWhereToAddNewBlock = vm.sdEditorCtrl.getBlockPosition(vm.textBlockCtrl.block) + 1;
                // cut the text that is after the caret in the block and save it in order to add it after the embed later
                var textThatWasAfterCaret = vm.textBlockCtrl.extractEndOfBlock().innerHTML;
                if (textThatWasAfterCaret && textThatWasAfterCaret !== '') {
                    // save the blocks (with removed leading text)
                    vm.textBlockCtrl.updateModel();
                    // add new text block for the remaining text
                    vm.sdEditorCtrl.insertNewBlock(indexWhereToAddNewBlock, {
                        body: textThatWasAfterCaret
                    }, true);
                }
                // show the add-embed form
                vm.textBlockCtrl.block.showAndFocusLowerAddAnEmbedBox();
            },
            addPicture: function() {
                superdesk.intent('upload', 'media').then(function(images) {
                    // cut the text that is after the caret in the block and save it in order to add it after the embed later
                    var textThatWasAfterCaret = vm.textBlockCtrl.extractEndOfBlock().innerHTML;
                    // save the blocks (with removed leading text)
                    vm.textBlockCtrl.updateModel();
                    var indexWhereToAddBlock = vm.sdEditorCtrl.getBlockPosition(vm.textBlockCtrl.block) + 1;
                    images.forEach(function(image, index) {
                        editor.generateImageTag(image).then(function(imgTag) {
                            vm.sdEditorCtrl.insertNewBlock(indexWhereToAddBlock, {
                                blockType: 'embed',
                                embedType: 'Image',
                                body: imgTag,
                                caption: image.description_text,
                                association: image
                            }, true);
                            indexWhereToAddBlock++;
                        });
                    });
                    // add new text block for the remaining text
                    vm.sdEditorCtrl.insertNewBlock(indexWhereToAddBlock, {
                        body: textThatWasAfterCaret
                    }, true);
                }, function() {
                    scope.node.focus();
                    vm.textBlockCtrl.restoreSelection();
                });
            },
            pasteBlock: function() {
                if (!vm.sdEditorCtrl.getCutBlock()) {
                    return false;
                }
                var indexWhereToAddNewBlock = vm.sdEditorCtrl.getBlockPosition(vm.textBlockCtrl.block) + 1;
                // cut the text that is after the caret in the block and save it in order to add it after the embed later
                var textThatWasAfterCaret = vm.textBlockCtrl.extractEndOfBlock().innerHTML;
                if (textThatWasAfterCaret && textThatWasAfterCaret !== '') {
                    // save the blocks (with removed leading text)
                    vm.textBlockCtrl.updateModel();
                    // add new text block for the remaining text
                    vm.sdEditorCtrl.insertNewBlock(indexWhereToAddNewBlock, {
                        body: textThatWasAfterCaret
                    }, true);
                }
                vm.sdEditorCtrl.insertNewBlock(indexWhereToAddNewBlock, vm.sdEditorCtrl.getCutBlock(true));
            },
        }
    });
}
})();

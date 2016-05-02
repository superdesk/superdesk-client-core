(function() {
'use strict';

angular.module('superdesk.editor2.ctrl', []).controller('SdTextEditorController', SdTextEditorController);

SdTextEditorController.$inject = ['lodash', 'EMBED_PROVIDERS', '$timeout', '$element', 'editor'];
function SdTextEditorController(_, EMBED_PROVIDERS, $timeout, $element, editor) {
    var vm = this;
    function Block(attrs) {
        angular.extend(this, {
            body: attrs && attrs.body || '',
            loading: attrs && attrs.loading || false,
            caption: attrs && attrs.caption || undefined,
            blockType: attrs && attrs.blockType || 'text',
            embedType: attrs && attrs.embedType || undefined,
            association: attrs && attrs.association || undefined,
            lowerAddEmbedIsExtented: undefined,
            showAndFocusLowerAddAnEmbedBox: function() {
                this.lowerAddEmbedIsExtented = true;
            },
        });
    }
    /**
    * For the given blocks, merge text blocks when there are following each other and add empty text block arround embeds if needed
    */
    function prepareBlocks(blocks) {
        var newBlocks = [];
        blocks.forEach(function(block, i) {
            // if not the first block and there is a text block following another one
            if (i > 0 && block.blockType === 'text' && blocks[i - 1].blockType === 'text') {
                // we merge the content with the previous block
                newBlocks[newBlocks.length - 1].body += block.body;
            } else {
                // otherwise we add the full block
                newBlocks.push(block);
            }
            // add emtpy text block if block is between 2 embed blocks or at the end
            if (blocks[i].blockType === 'embed') {
                if (i === blocks.length - 1 || blocks[i + 1].blockType === 'embed') {
                    newBlocks.push(new Block());
                }
            }
        });
        // add emtpy text block at the top if needed
        if (newBlocks[0].blockType === 'embed') {
            newBlocks.unshift(new Block());
        }
        return newBlocks;
    }
    function splitIntoBlock(bodyHtml) {
        var blocks = [], block;
        /**
        * push the current block into the blocks collection if it is not empty
        */
        function commitBlock() {
            if (block !== undefined && block.body.trim() !== '') {
                blocks.push(block);
                block = undefined;
            }
        }
        $('<div>' + bodyHtml + '</div>')
        .contents()
        .toArray()
        .forEach(function(element) {
            // if we get a <p>, we push the current block and create a new one
            // for the paragraph content
            if (element.nodeName === 'P') {
                commitBlock();
                if (angular.isDefined(element.innerHTML) && element.textContent !== '' && element.textContent !== '\n') {
                    blocks.push(new Block({body: element.outerHTML.trim()}));
                }
                // detect if it's an embed
            } else if (element.nodeName === '#comment') {
                if (element.nodeValue.indexOf('EMBED START') > -1) {
                    commitBlock();
                    // retrieve the embed type following the comment
                    var embedType;
                    var embedTypeRegex = /EMBED START ([\w-]+)/;
                    var match;
                    if ((match = embedTypeRegex.exec(angular.copy(element.nodeValue).trim())) !== null) {
                        embedType = match[1];
                    } else {
                        embedType = EMBED_PROVIDERS.custom;
                    }
                    // retrieve the association reference
                    var association;
                    var embedAssoKey = /{id: "(embedded\d+)"}/;
                    if ((match = embedAssoKey.exec(angular.copy(element.nodeValue).trim())) !== null) {
                        association = vm.associations && vm.associations[match[1]];
                    }
                    // create the embed block
                    block = new Block({blockType: 'embed', embedType: embedType, association: association});
                }
                if (element.nodeValue.indexOf('EMBED END') > -1) {
                    commitBlock();
                }
                // if it's not a paragraph or an embed, we update the current block
            } else {
                if (block === undefined) {
                    block = new Block();
                }
                // we want the outerHTML (ex: '<b>text</b>') or the node value for text and comment
                block.body += (element.outerHTML || element.nodeValue || '').trim();
            }
        });
        // at the end of the loop, we push the last current block
        if (block !== undefined && block.body.trim() !== '') {
            blocks.push(block);
        }
        // Complete embeds with metadata (from association datadata or html)
        blocks.forEach(function(block) {
            if (block.blockType === 'embed') {
                // for images that come from Superdesk, we use the association
                if (block.association && block.embedType === 'Image') {
                    block.caption = block.association.description_text;
                    var url;
                    // prefers "embed" for image url, otherwise "viewImage"
                    if (block.association.renditions.embed) {
                        url = block.association.renditions.embed.href;
                    } else {
                        url = block.association.renditions.viewImage.href;
                    }
                    block.body = '';
                    editor.generateImageTag(block.association).then(function(img) {
                        block.body = img;
                    });
                } else {
                    // extract body and caption from embed block html
                    var original_body = angular.element(angular.copy(block.body));
                    if (original_body.get(0).nodeName === 'FIGURE') {
                        block.body = '';
                        original_body.contents().toArray().forEach(function(element) {
                            if (element.nodeName === 'FIGCAPTION') {
                                block.caption = element.innerHTML;
                            } else {
                                block.body += element.outerHTML || element.nodeValue || '';
                            }
                        });
                    }
                }
            }
        });
        // if no block, create an empty one to start
        if (blocks.length === 0) {
            blocks.push(new Block());
        }
        return blocks;
    }
    angular.extend(vm, {
        blocks: [],
        initEditorWithOneBlock: function(model) {
            vm.model = model;
            vm.blocks = [new Block({body: model.$modelValue})];
        },
        initEditorWithMultipleBlock: function(model) {
            // save the model to update it later
            vm.model = model;
            // parse the given model and create blocks per paragraph and embed
            var content = model.$modelValue || '';
            // update the actual blocks value at the end to prevent more digest cycle as needed
            vm.blocks = splitIntoBlock(content);
            vm.renderBlocks();
        },
        serializeBlock: function(blocks) {
            blocks = angular.isDefined(blocks) ? blocks : vm.blocks;
            var new_body = '';
            if (vm.config.multiBlockEdition) {
                blocks.forEach(function(block) {
                    if (angular.isDefined(block.body) && block.body.trim() !== '') {
                        if (block.blockType === 'embed') {
                            var blockName = block.embedType.trim();
                            // add an id to the image in order to retrieve it in `assocations` field
                            if (block.association) {
                                blockName += ' {id: "embedded' + vm.generateBlockId(block) + '"}';
                            }
                            new_body += [
                                '<!-- EMBED START ' + blockName + ' -->\n',
                                '<figure>',
                                block.body,
                                '<figcaption>',
                                block.caption,
                                '</figcaption>',
                                '</figure>',
                                '\n<!-- EMBED END ' + blockName + ' -->\n'].join('');
                        } else {
                            new_body += block.body + '\n';
                        }
                    }
                });
            } else {
                new_body = blocks[0].body;
            }
            // strip <br> and <p>
            new_body = new_body.trim().replace(/<p><br><\/p>$/, '');
            new_body = new_body.replace(/<br>$/, '');
            return new_body;
        },
        commitChanges: function() {
            // initialize associations if doesn't exist
            if (typeof vm.associations !== 'object') {
                vm.associations = {};
            }
            // remove older associations
            angular.forEach(vm.associations, function(value, key) {
                if (_.startsWith(key, 'embedded')) {
                    delete vm.associations[key];
                }
            });
            // update associations with the ones stored in blocks
            vm.associations = angular.extend({}, vm.associations, vm.getAssociations());
            // save model with latest state of blocks
            vm.model.$setViewValue(vm.serializeBlock());
        },
        /**
        * Return an object that contains the embedded images in the story
        */
        getAssociations: function() {
            var association = {};
            vm.blocks.forEach(function(block) {
                // we keep the association only for Superdesk images
                if (block.association) {
                    // add the association
                    association['embedded' + vm.generateBlockId(block)] = angular.copy(block.association);
                }
            });
            return association;
        },
        getBlockPosition: function(block) {
            return _.indexOf(vm.blocks, block);
        },
        /**
        ** Merge text blocks when there are following each other and add empty text block arround embeds if needed
        ** @param {Integer} position
        ** @param {Object} block ; block attributes
        ** @param {boolean} doNotRenderBlocks ; if true, it won't merge text blocks and
        ** add empty text block if needed through the `renderBlocks()` function.
        ** @returns {object} this
        */
        insertNewBlock: function(position, attrs, doNotRenderBlocks) {
            var new_block = new Block(attrs);
            vm.blocks.splice(position, 0, new_block);
            $timeout(vm.commitChanges);
            if (!doNotRenderBlocks) {
                $timeout(vm.renderBlocks);
            }
            return new_block;
        },
        /**
        * Merge text blocks when there are following each other and add empty text block arround embeds if needed
        */
        renderBlocks: function() {
            vm.blocks = prepareBlocks(vm.blocks);
        },
        removeBlock: function(block) {
            // remove block only if it's not the only one
            var block_position = vm.getBlockPosition(block);
            if (vm.blocks.length > 1) {
                vm.blocks.splice(block_position, 1);
            } else {
                // if it's the first block, just remove the content
                block.body = '';
            }
            vm.renderBlocks();
            $timeout(vm.commitChanges);
        },
        getPreviousBlock: function(block) {
            var pos = vm.getBlockPosition(block);
            // if not the first one
            if (pos > 0) {
                return vm.blocks[pos - 1];
            }
        },
        reorderingMode: false,
        hideHeader: function(hide) {
            hide = angular.isDefined(hide) ? hide : true;
            var prop;
            if (hide) {
                prop = {
                    opacity: 0.4,
                    pointerEvents: 'none'
                };
            } else {
                prop = {
                    opacity: 1,
                    pointerEvents: 'auto'
                };
            }
            angular.element('.authoring-header, .preview-modal-control, .theme-controls').css(prop);
        },
        enableReorderingMode: function(position, event) {
            var blockToMove = vm.blocks[position];
            var before = vm.serializeBlock(vm.blocks.slice(0, position));
            var after = vm.serializeBlock(vm.blocks.slice(position + 1));
            // split into blocks what is before the selected block
            var newBlocks = splitIntoBlock(before);
            // add the selected block in one piece
            newBlocks.push(blockToMove);
            // split into blocks what is after the selected block
            newBlocks = newBlocks.concat(splitIntoBlock(after));
            // save the vertical scroll position
            var offsetTop = angular.element(event.currentTarget).offset().top;
            // hide the header
            vm.hideHeader();
            // update the view model
            angular.extend(vm, {
                // save the new blocks (texts are a splited per paragraph)
                blocks: newBlocks,
                // save the index of the selected block
                blockToMoveIndex: newBlocks.indexOf(blockToMove),
                // used in template to show the reordering UI
                reorderingMode: true
            });
            // restore the scroll postion at the new element level
            $timeout(function() {
                var el = $element.find('.block__container').get(vm.blockToMoveIndex);
                var container = angular.element('.page-content-container');
                var offset = container.scrollTop() + angular.element(el).offset().top - offsetTop;
                container.scrollTop(offset);
            }, 200, false); // wait after transitions
        },
        reorderToPosition: function(position) {
            // adjust the position. Remove one if the moved element was before the wanted position
            position = position > vm.blockToMoveIndex ? position - 1 : position;
            // move the selected block to the given position
            vm.blocks.splice(position, 0, vm.blocks.splice(vm.blockToMoveIndex, 1)[0]);
            // save new position
            vm.blockToMoveIndex = position;
            // exit the reordering mode
            vm.disableReorderingMode();
        },
        disableReorderingMode: function() {
            // reset reorder mode state in vm
            angular.extend(vm, {
                blockToMoveIndex: undefined,
                reorderingMode: false
            });
            // show the header
            vm.hideHeader(false);
            // merge the text blocks together
            vm.renderBlocks();
            // save changes
            $timeout(vm.commitChanges);
        },
        /**
        * Compute an id for the block with its content and its position.
        * Used as `track by` value, it allows the blocks to be well rendered.
        */
        generateBlockId: function(block) {
            function hashCode(string) {
                var hash = 0, i, chr, len;
                if (string.length === 0) {
                    return hash;
                }
                for (i = 0, len = string.length; i < len; i++) {
                    chr   = string.charCodeAt(i);
                    /*jshint bitwise: false */
                    hash  = ((hash << 5) - hash) + chr;
                    hash |= 0; // Convert to 32bit integer
                }
                return hash;
            }
            return String(Math.abs(hashCode(block.body))) + String(vm.getBlockPosition(block));
        }
    });
}
})();

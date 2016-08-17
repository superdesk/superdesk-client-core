(function() {
'use strict';

angular.module('superdesk.editor2.ctrl', []).controller('SdTextEditorController', SdTextEditorController);

SdTextEditorController.$inject = ['lodash', 'EMBED_PROVIDERS', '$timeout', '$element', 'editor', 'config', '$q'];
function SdTextEditorController(_, EMBED_PROVIDERS, $timeout, $element, editor, config, $q) {
    var vm = this;
    function Block(attrs) {
        var self = this;
        if (!angular.isDefined(attrs)) {
            attrs = {};
        }
        angular.extend(self, _.defaults({
            body: attrs.body,
            loading: attrs.loading,
            caption: attrs.caption,
            blockType: attrs.blockType,
            embedType: attrs.embedType,
            association: attrs.association,
            lowerAddEmbedIsExtended: undefined,
            showAndFocusLowerAddAnEmbedBox: function() {
                self.lowerAddEmbedIsExtended = true;
            }
        }, {
            body: '<p><br></p>',
            loading: false,
            blockType: 'text'
        }));
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
                        if (vm.associations) {
                            association = angular.copy(vm.associations[match[1]]);
                        }
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
                    block = new Block({body: ''});
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
                    editor.generateMediaTag(block.association).then(function(img) {
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
        configuration: angular.extend({embeds: true}, config.editor || {}),
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
            // in case blocks are not ready
            if (blocks.length === 0) {
                return '';
            }
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
                new_body = (blocks.length > 0) ? blocks[0].body : '';
            }
            // strip <br> and <p>
            new_body = new_body.trim().replace(/<p><br><\/p>$/, '');
            new_body = new_body.replace(/<br>$/, '');
            return new_body;
        },
        commitChanges: function() {
            var associations = angular.copy(vm.associations);
            // initialize associations if doesn't exist
            if (typeof associations !== 'object') {
                associations = {};
            }
            // remove older associations
            angular.forEach(associations, function(value, key) {
                if (_.startsWith(key, 'embedded')) {
                    associations[key] = null;
                }
            });

            if (Object.keys(associations).length || vm.associations) {
                // update associations with the ones stored in blocks
                vm.associations = angular.extend({}, associations, vm.getAssociations());
            }

            // save model with latest state of blocks
            var serialized = vm.serializeBlock();
            if (serialized !== vm.model.$viewValue) {
                vm.model.$setViewValue(vm.serializeBlock());
            }
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
        splitAndInsert: function(textBlockCtrl, blocksToInsert) {
            // index where to add the new block
            var index = vm.getBlockPosition(textBlockCtrl.block) + 1;
            if (index === 0) {
                throw 'Block to split not found';
            }
            // cut the text that is after the caret in the block and save it in order to add it after the embed later
            var after = textBlockCtrl.extractEndOfBlock().innerHTML;
            return $q.when((function() {
                if (after) {
                    // save the blocks (with removed leading text)
                    textBlockCtrl.updateModel();
                    // add new text block for the remaining text
                    return vm.insertNewBlock(index, {
                        body: after
                    }, true);
                }
            })()).then(function() {
                if (angular.isDefined(blocksToInsert)) {
                    var isArray = true;
                    if (!angular.isArray(blocksToInsert)) {
                        isArray = false;
                        blocksToInsert = [blocksToInsert];
                    }
                    var waitFor = $q.when();
                    var createdBlocks = [];
                    blocksToInsert.forEach(function(bti) {
                        waitFor = waitFor.then(function() {
                            var newBlock = vm.insertNewBlock(index, bti);
                            createdBlocks.push(newBlock);
                            return newBlock;
                        });
                    });
                    return waitFor.then(function() {
                        if (isArray) {
                            return $q.all(createdBlocks);
                        } else {
                            return createdBlocks[0];
                        }
                    });
                }
            });
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
            return $q(function(resolve) {
                $timeout(function() {
                    vm.blocks.splice(position, 0, new_block);
                    $timeout(function() {
                        vm.commitChanges();
                        if (!doNotRenderBlocks) {
                            $timeout(function() {
                                vm.renderBlocks();
                                resolve(new_block);
                            }, 0, false);
                        } else {
                            resolve(new_block);
                        }
                    }, 0, false);
                });
            });
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
            return $timeout(vm.commitChanges);
        },
        clipboard: undefined,
        cutBlock: function(block) {
            vm.clipboard = angular.copy(block);
            return vm.removeBlock(block);
        },
        getCutBlock: function(remove) {
            var block = vm.clipboard;
            if (remove) {
                vm.clipboard = undefined;
            }
            return block;
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

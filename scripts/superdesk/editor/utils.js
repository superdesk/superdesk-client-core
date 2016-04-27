(function() {
    'use strict';

    function EditorUtilsFactory() {

        var CLONE_CLASS = 'clone';
        var HILITE_CLASS = 'sdhilite';

        /**
         * Function for sorting array of strings from longest to shortest
         *
         * @param {string} a
         * @param {string} b
         * @return {number}
         */
        function reverseLengthSort(a, b) {
            return b.length - a.length;
        }

        /**
         * Find text node within given node for given character offset
         *
         * This will find text node within given node that contains character on given offset
         *
         * @param {Node} node
         * @param {numeric} offset
         * @return {Object} {node: {Node}, offset: {numeric}}
         */
        function findOffsetNode(node, offset) {
            var tree = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
            var currentLength;
            var currentOffset = 0;
            var ZERO_WIDTH_SPACE = String.fromCharCode(65279);
            while (tree.nextNode()) {
                tree.currentNode.textContent = tree.currentNode.textContent.replace(ZERO_WIDTH_SPACE, '');
                currentLength = tree.currentNode.textContent.length;
                if (currentOffset + currentLength >= offset) {
                    return {node: tree.currentNode, offset: offset - currentOffset};
                }

                currentOffset += currentLength;
            }
        }

        /**
         * Escape given string for reg exp
         *
         * @url https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
         *
         * @param {string} string
         * @return {string}
         */
        function escapeRegExp(string){
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        return {

            /**
             * Find all matches for current find&replace needle in given node
             *
             * Each match is {word: {string}, offset: {number}} in given node,
             * we can't return nodes here because those will change when we start
             * highlighting and offsets wouldn't match
             *
             * @param {Node} node
             * @param {Object} settings
             * @return {Array} list of matches
             */
            getFindReplaceTokens: function(node, settings) {
                var tokens = [];
                var diff = settings.findreplace.diff || {};
                var pattern = Object.keys(diff).sort(reverseLengthSort).map(escapeRegExp).join('|');
                if (!pattern) {
                    return tokens;
                }

                var flags = settings.findreplace.caseSensitive ? 'm' : 'im';
                var re = new RegExp(pattern, flags);
                var nodeOffset = 0;
                var text, match, offset;

                var tree = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
                while (tree.nextNode()) {
                    text = tree.currentNode.textContent;
                    while ((match = text.match(re)) != null) {
                        tokens.push({
                            word: match[0],
                            index: nodeOffset + match.index,
                            title: diff[match[0]] || ''
                        });

                        offset = match.index + match[0].length;
                        text = text.substr(offset);
                        nodeOffset += offset;
                    }

                    nodeOffset += text.length;
                }

                return tokens;
            },

            /**
             * Hilite all tokens within node using span with given className
             *
             * This first stores caret position, updates markup, and then restores the caret.
             *
             * @param {Node} node
             * @param {Array} tokens
             * @param {string} className
             * @param {Boolean} preventStore
             */
            hilite: function(node, tokens, className, preventStore) {
                // remove old hilites
                this.removeHilites(node);

                // create a clone
                var hiliteNode = node.cloneNode(true);
                hiliteNode.classList.add(CLONE_CLASS);

                // generate hilite markup in clone
                tokens.forEach(function(token) {
                    this.hiliteToken(hiliteNode, token, className);
                }.bind(this));

                // render clone
                node.parentNode.appendChild(hiliteNode);
            },

            /**
             * Highlight single `token` via putting it into a span with given class
             *
             * @param {Node} node
             * @param {Object} token
             * @param {string} className
             */
            hiliteToken: function(node, token, className) {
                var start = this.findWordNode(node, token.index, token.word.length);
                var replace = start.node.splitText(start.offset);
                var span = document.createElement('span');
                span.classList.add(className);
                span.classList.add(HILITE_CLASS);
                replace.splitText(token.word.length);
                span.textContent = replace.textContent;
                span.dataset.word = token.word;
                span.dataset.index = token.index;
                replace.parentNode.replaceChild(span, replace);
            },

            /**
             * Remove hilites node from nodes parent
             *
             * @param {Node} node
             */
            removeHilites: function(node) {
                var parentNode = node.parentNode;
                var clones = parentNode.getElementsByClassName(CLONE_CLASS);
                if (clones.length) {
                    parentNode.removeChild(clones.item(0));
                }
            },

            /**
             * Find text node within given node where word is located
             *
             * It will find text type node where the whole word is located
             *
             * @param {Node} node
             * @param {Number} index
             * @param {Number} length
             * @return {Object} {node: {Node}, offset: {Number}}
             */
            findWordNode: function(node, index, length) {
                var start = findOffsetNode(node, index);
                var end = findOffsetNode(node, index + length);

                // correction for linebreaks - first node on a new line is set to
                // linebreak text node which is not even visible in dom, maybe dom bug?
                if (start.node !== end.node) {
                    start.node = end.node;
                    start.offset = 0;
                }

                return start;
            }
        };
    }

    angular.module('superdesk.editor.utils', [])
        .factory('editorUtils', EditorUtilsFactory)
        ;
})();

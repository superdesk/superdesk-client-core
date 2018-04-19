var embedCodeHandlers = require('./embedCodeHandlers.js');

angular.module('superdesk.apps.editor2.embed', []).controller('SdAddEmbedController', SdAddEmbedController);

SdAddEmbedController.$inject = ['embedService', '$element', '$timeout', '$q', 'lodash',
    'EMBED_PROVIDERS', '$scope', 'editor', '$injector'];
function SdAddEmbedController(embedService, $element, $timeout, $q, _,
    EMBED_PROVIDERS, $scope, editor, $injector) {
    var self = this;

    angular.extend(self, {
        editorCtrl: undefined, // defined in link method
        previewLoading: false,
        toggle: function(close) {
            // use parameter or toggle
            self.extended = angular.isDefined(close) ? !close : !self.extended;
        },
        retrieveEmbed: function() {
            function retrieveEmbedFromUrl() {
                return embedService.get(self.input).then((data) => {
                    var embed = data.html;

                    if (!angular.isDefined(embed)) {
                        if (data.type === 'link') {
                            embed = editor.generateLinkTag({
                                url: data.url,
                                title: data.meta.title,
                                description: data.meta.description,
                                illustration: data.thumbnail_url,
                            });
                        } else {
                            embed = editor.generateMediaTag({url: data.url, altText: data.description});
                        }
                    }
                    return $q.when(embed).then((embed) => ({
                        body: embed,
                        provider: data.provider_name || EMBED_PROVIDERS.custom,
                    }));
                });
            }
            function parseRawEmbedCode() {
                var waitFor = [];
                var embedBlock = {
                    body: self.input,
                    provider: EMBED_PROVIDERS.custom,
                };

                function updateEmbedBlock(partialUpdate) {
                    angular.extend(embedBlock, partialUpdate);
                }
                // try to guess the provider of the custom embed
                for (var i = 0; i < embedCodeHandlers.length; i++) {
                    var provider = $injector.invoke(embedCodeHandlers[i]);

                    if (angular.isDefined(provider.condition)) {
                        if (!provider.condition()) {
                            continue;
                        }
                    }
                    var match = provider.pattern.exec(self.input);

                    if (match) {
                        updateEmbedBlock({provider: provider.name});
                        if (provider.callback) {
                            waitFor.push(provider.callback(match).then(updateEmbedBlock));
                        }
                        break;
                    }
                }
                return $q.all(waitFor).then(() => embedBlock);
            }
            var embedCode;
            // if it's an url, use embedService to retrieve the embed code

            if (_.startsWith(self.input, 'http')) {
                embedCode = retrieveEmbedFromUrl(self.input);
            // otherwise we use the content of the field directly
            } else {
                embedCode = parseRawEmbedCode(self.input);
            }
            return $q.when(embedCode);
        },
        updatePreview: function() {
            self.previewLoading = true;
            self.retrieveEmbed().then((embed) => {
                angular.element($element)
                    .find('.preview')
                    .html(embed.body.replace('\\n', ''));
                self.previewLoading = false;
            });
        },
        createFigureBlock: function(data) {
            // create a new block containing the embed
            data.blockType = 'embed';
            return self.editorCtrl.insertNewBlock(self.addToPosition, data);
        },
        createBlockFromEmbed: function() {
            self.retrieveEmbed().then((embed) => {
                self.createFigureBlock({
                    embedType: embed.provider,
                    body: embed.body,
                    association: embed.association,
                });
                // close the addEmbed form
                self.toggle(true);
            });
        },
        closeEmbed: function() {
            // put block back together on embed form close.
            self.toggle();
        },
    });

    // toggle when the `extended` directive attribute changes
    $scope.$watch(() => self.extended, (extended, wasExtended) => {
        // on enter, focus on input
        if (angular.isDefined(extended)) {
            if (extended) {
                $timeout(() => {
                    angular.element($element)
                        .find('input')
                        .focus();
                }, 500, false); // positive timeout because of a chrome issue
            // on leave, clear field
            } else if (wasExtended) {
                self.input = '';
                if (typeof self.onClose === 'function') {
                    $timeout(self.onClose);
                }
            }
        }
    });
}

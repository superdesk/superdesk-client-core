(function() {
'use strict';

angular.module('superdesk.editor2.embed', []).controller('SdAddEmbedController', SdAddEmbedController);

SdAddEmbedController.$inject = ['embedService', '$element', '$timeout', '$q', 'lodash', 'EMBED_PROVIDERS', '$scope', 'editor', '$http'];
function SdAddEmbedController (embedService, $element, $timeout, $q, _, EMBED_PROVIDERS, $scope, editor, $http) {
    var vm = this;
    angular.extend(vm, {
        editorCtrl: undefined,  // defined in link method
        previewLoading: false,
        // extended: angular.isDefined(vm.extended) ? vm.extended : undefined,
        toggle: function(close) {
            // use parameter or toggle
            vm.extended = angular.isDefined(close) ? !close : !vm.extended;
        },
        /**
         * Return html code to represent an embedded link
         *
         * @param {string} url
         * @param {string} title
         * @param {string} description
         * @param {string} illustration
         * @return {string} html
         */
        linkToHtml: function(url, title, description, illustration) {
            var html = [
                '<div class="embed--link">',
                angular.isDefined(illustration) ?
                '  <img src="' + illustration + '" class="embed--link__illustration"/>' : '',
                '  <div class="embed--link__title">',
                '      <a href="' + url + '" target="_blank">' + title + '</a>',
                '  </div>',
                '  <div class="embed--link__description">' + description + '</div>',
                '</div>'];
            return html.join('\n');
        },
        retrieveEmbed:function() {
            function retrieveEmbedFromUrl() {
                return embedService.get(vm.input).then(function(data) {
                    var embed = data.html;
                    if (!angular.isDefined(embed)) {
                        if (data.type === 'link') {
                            embed = vm.linkToHtml(data.url, data.title, data.description, data.thumbnail_url);
                        } else {
                            embed = editor.generateImageTag({url: data.url, altText: data.description});
                        }
                    }
                    return $q.when(embed).then(function(embed) {
                        return {
                            body: embed,
                            provider: data.provider_name || EMBED_PROVIDERS.custom
                        };
                    });
                });
            }
            function parseRawEmbedCode() {
                var waitFor = [];
                var embedBlock = {
                    body: vm.input,
                    provider: EMBED_PROVIDERS.custom
                };
                var providersKnown = [
                    {
                        pattern: /twitter\.com\/widgets\.js/g,
                        name: EMBED_PROVIDERS.twitter
                    },
                    {
                        pattern: /www\.youtube\.com/g,
                        name: EMBED_PROVIDERS.youtube
                    },
                    {
                        pattern: /src="(.*vidible\.tv.*pid=.*.js)/g,
                        name: EMBED_PROVIDERS.vidible,
                        callback: function(match) {
                            var url = 'https://' + match[1];
                            // $http raise a Same Origin Policy error, so we use jquery here
                            waitFor.push(
                                $q(function(resolve, reject) {
                                    $.ajax({
                                        url: url,
                                        type: 'GET',
                                        dataType: 'text',
                                        success: function(data) {
                                            data = /({.*})/.exec(data)[1];
                                            data = JSON.parse(data);
                                            // set association
                                            embedBlock.association = {
                                                id: data.bid.id,
                                                title: data.bid.videos[0].name,
                                                thumbnail: data.bid.videos[0].thumbnail,
                                                url: data.bid.videos[0].videoUrls[0],
                                                // size: ,
                                                // creationDate: ,
                                                company: data.bid.videos[0].studioName,
                                                duration: data.bid.videos[0].metadata.duration,
                                            };
                                            resolve(embedBlock);
                                        }
                                    });
                                })
                            );
                        }
                    }
                ];
                // try to guess the provider of the custom embed
                for (var i = 0; i < providersKnown.length; i++) {
                    var provider = providersKnown[i];
                    var match = provider.pattern.exec(vm.input);
                    if (match) {
                        embedBlock.provider = provider.name;
                        if (provider.callback) {
                            provider.callback(match);
                        }
                        break;
                    }
                }
                return $q.all(waitFor).then(function() {
                    return embedBlock;
                });
            }
            var embedCode;
            // if it's an url, use embedService to retrieve the embed code
            if (_.startsWith(vm.input, 'http')) {
                embedCode = retrieveEmbedFromUrl(vm.input);
            // otherwise we use the content of the field directly
            } else {
                embedCode = parseRawEmbedCode(vm.input);
            }
            return $q.when(embedCode);
        },
        updatePreview: function() {
            vm.previewLoading = true;
            vm.retrieveEmbed().then(function(embed) {
                angular.element($element).find('.preview').html(embed.body.replace('\\n', ''));
                vm.previewLoading = false;
            });
        },
        createFigureBlock: function(data) {
            // create a new block containing the embed
            data.blockType = 'embed';
            return vm.editorCtrl.insertNewBlock(vm.addToPosition, data);
        },
        createBlockFromEmbed: function() {
            vm.retrieveEmbed().then(function(embed) {
                vm.createFigureBlock({
                    embedType: embed.provider,
                    body: embed.body,
                    association: embed.association
                });
                // close the addEmbed form
                vm.toggle(true);
            });
        },
        createBlockFromSdPicture: function(img) {
            editor.generateImageTag(img).then(function(imgTag) {
                return vm.createFigureBlock({
                    embedType: 'Image',
                    body: imgTag,
                    caption: img.description_text,
                    association: img
                });
            });
        }
    });

    // toggle when the `extended` directive attribute changes
    $scope.$watch(function() {
        return vm.extended;
    }, function(extended) {
        // on enter, focus on input
        if (angular.isDefined(extended)) {
            if (extended) {
                $timeout(function() {
                    angular.element($element).find('input').focus();
                }, 500, false); // positive timeout because of a chrome issue
            // on leave, clear field
            } else {
                vm.input = '';
                vm.onClose();
            }
        }
    });
}
})();

import _ from 'lodash';
import {gettext} from 'core/utils';
import {sdApi} from 'api';

export const KEYS = Object.freeze({
    pageup: 33,
    pagedown: 34,
    left: 37,
    up: 38,
    right: 39,
    down: 40,
    enter: 13,
    escape: 27,
    space: 32,
    backspace: 8,
});

const superdeskKeyboardKeyNamesConvention = {
    // native key name, superdesk key name
    'Enter': 'enter',
    'ArrowUp': 'up',
    'ArrowRight': 'right',
    'ArrowLeft': 'left',
    'ArrowDown': 'down',
    'Escape': 'escape',
};

function getKeyAccordingToSuperdeskConvention(key: string) {
    return superdeskKeyboardKeyNamesConvention[key] ?? key.toLowerCase();
}

export function getNativeKey(superdeskKey) {
    return Object.keys(superdeskKeyboardKeyNamesConvention)
        .find((key) => superdeskKeyboardKeyNamesConvention[key] === superdeskKey) ?? superdeskKey;
}

function shouldInvoke(combination: string, event: KeyboardEvent) {
    let key = null;
    let ctrlKey = false;
    let altKey = false;
    let shiftKey = false;

    combination.split('+').forEach((_key) => {
        if (_key === 'ctrl') {
            ctrlKey = true;
        } else if (_key === 'alt') {
            altKey = true;
        } else if (_key === 'shift') {
            shiftKey = true;
        } else {
            key = _key;
        }
    });

    return (
        event.ctrlKey === ctrlKey
        && event.altKey === altKey
        && event.shiftKey === shiftKey
        && getKeyAccordingToSuperdeskConvention(event.key) === key
    );
}

/**
 * keyboardManager removes bindings on route change and thus doesn't work for global bindings
 */
export function registerGlobalKeybindings() {
    window.addEventListener('keydown', (event) => {
        const {currentPathStartsWith} = sdApi.navigation;

        // ctrl+m creates a new article using the default desk template
        if (
            shouldInvoke('ctrl+m', event)
            && (currentPathStartsWith(['workspace']) || currentPathStartsWith(['search']))
        ) {
            sdApi.article.createNewUsingDeskTemplate();
        }
    });
}

export default angular.module('superdesk.core.keyboard', [])

    .constant('Keys', KEYS)

    .constant('shiftNums', {
        '`': '~',
        1: '!',
        2: '@',
        3: '#',
        4: '$',
        5: '%',
        6: '^',
        7: '&',
        8: '*',
        9: '(',
        0: ')',
        '-': '_',
        '=': '+',
        ';': ':',
        '\'': '"',
        ',': '<',
        '.': '>',
        '/': '?',
        '\\': '|',
    })

// unbind all keyboard shortcuts when switching route
    .run(['$rootScope', 'keyboardManager', function($rootScope, kb) {
        $rootScope.$on('$routeChangeStart', () => {
            angular.forEach(kb.keyboardEvent, (e, key) => {
                if (!e.opt.global) {
                    kb.unbind(key);
                }
            });
        });
    }])

/**
 * Broadcast key:char events cought on body
 */
    .run(['$rootScope', '$document', 'Keys', 'shiftNums',
        function KeyEventBroadcast($rootScope, $document, Keys, shiftNums) {
            var ignoreNodes = {
                INPUT: true,
                TEXTAREA: true,
                BUTTON: true,
            };

            $document.on('keydown', (e) => {
                var ctrlKey = e.ctrlKey || e.metaKey,
                    altKey = e.altKey,
                    shiftKey = e.shiftKey,
                    isGlobal = ctrlKey && shiftKey;

                if (isGlobal || !ignoreNodes[e.target.nodeName]) { // $document.body is empty when testing
                    var character = e.key.toLowerCase(),
                        modifier = '';

                    modifier += ctrlKey ? 'ctrl:' : '';
                    modifier += altKey ? 'alt:' : '';
                    modifier += shiftKey ? 'shift:' : '';

                    // also handle arrows, enter/escape, etc.
                    angular.forEach(Object.keys(Keys), (key) => {
                        if (e.which === Keys[key]) {
                            character = key;
                        }
                    });

                    // Emit the corresponding shift character the same way keyboardManager service emits
                    if (shiftKey && shiftNums[character]) {
                        character = shiftNums[character];
                    }

                    $rootScope.$broadcast('key:' + modifier + character, e);
                }
            });
        }])

    .service('keyboardManager', ['$window', '$timeout', 'shiftNums', function($window, $timeout, shiftNums) {
        var stack = [],
            defaultOpt = {
                type: 'keydown',
                propagate: true,
                inputDisabled: false,
                target: $window.document,
                keyCode: false,
                global: false,
            },
            specialKeys = { // Special Keys - and their codes
                esc: 27,
                escape: 27,
                tab: 9,
                space: 32,
                return: 13,
                enter: 13,
                backspace: 8,

                scrolllock: 145,
                scroll_lock: 145,
                scroll: 145,
                capslock: 20,
                caps_lock: 20,
                caps: 20,
                numlock: 144,
                num_lock: 144,
                num: 144,

                pause: 19,
                break: 19,

                insert: 45,
                home: 36,
                delete: 46,
                end: 35,

                pageup: 33,
                page_up: 33,
                pu: 33,

                pagedown: 34,
                page_down: 34,
                pd: 34,

                left: 37,
                up: 38,
                right: 39,
                down: 40,

                f1: 112,
                f2: 113,
                f3: 114,
                f4: 115,
                f5: 116,
                f6: 117,
                f7: 118,
                f8: 119,
                f9: 120,
                f10: 121,
                f11: 122,
                f12: 123,
            };

        // Store all keyboard combination shortcuts
        this.keyboardEvent = {};

        this.registry = {};
        this.register = function register(group, label, description) {
            this.registry[group] = this.registry[group] || {};
            this.registry[group][label] = description;
        };

        // Add a new keyboard combination shortcut
        this.bind = function bind(label, callback, opt) {
            var fct, elt;
            // Initialize options object
            let options = angular.extend({}, defaultOpt, opt);
            let lbl = label.toLowerCase();

            elt = options.target;
            if (typeof options.target === 'string') {
                elt = document.getElementById(options.target);
            }

            const inputDisabled = function(e) {
                if (options.inputDisabled) {
                    var elem;

                    if (e.target) {
                        elem = e.target;
                    } else if (e.srcElement) {
                        elem = e.srcElement;
                    }
                    if (elem.nodeType === 3) {
                        elem = elem.parentNode;
                    }
                    return elem.tagName === 'INPUT' || elem.tagName === 'TEXTAREA' ||
                    elem.className.indexOf('editor-type-html') !== -1;
                }
            };

            fct = function keyboardHandler(e = $window.event) {
            // Disable event handler when focus input and textarea
                if (inputDisabled(e)) {
                    return;
                }

                if (shouldInvoke(label, e)) {
                    $timeout(() => {
                        callback(e);
                    }, 1);

                    if (!options.propagate) { // Stop the event
                    // e.cancelBubble is supported by IE - this will kill the bubbling process.
                        e.cancelBubble = true;
                        e.returnValue = false;

                        // e.stopPropagation works in Firefox.
                        if (e.stopPropagation) {
                            e.stopPropagation();
                            e.preventDefault();
                        }
                        return false;
                    }
                }
            };

            // Store shortcut
            this.keyboardEvent[lbl] = {
                callback: fct,
                target: elt,
                event: options.type,
                _callback: callback,
                opt: options,
                label: lbl,
            };

            // Attach the function with the event
            if (elt.addEventListener) {
                elt.addEventListener(options.type, fct, false);
            } else if (elt.attachEvent) {
                elt.attachEvent('on' + options.type, fct);
            } else {
                elt['on' + options.type] = fct;
            }
        };

        this.push = function push(label, callback, options) {
            var e = this.keyboardEvent[label.toLowerCase()];

            if (e) {
                stack.push(e);
                this.unbind(label);
            }

            this.bind(label, callback, options);
        };

        this.pop = function pop(label) {
            this.unbind(label);
            var index = _.findLastIndex(stack, {label: label.toLowerCase()});

            if (index !== -1) {
                this.bind(label, stack[index]._callback, stack[index].opt);
                stack.splice(index, 0);
            }
        };

        // Remove the shortcut - just specify the shortcut and I will remove the binding
        this.unbind = function unbind(label) {
            let lbl = label.toLowerCase();
            var binding = this.keyboardEvent[lbl];

            delete this.keyboardEvent[lbl];
            if (!binding) {
                return;
            }
            var type = binding.event,
                elt = binding.target,
                callback = binding.callback;

            if (elt.detachEvent) {
                elt.detachEvent('on' + type, callback);
            } else if (elt.removeEventListener) {
                elt.removeEventListener(type, callback, false);
            } else {
                elt['on' + type] = false;
            }
        };
    }])

    .directive('sdHotkey', ['keyboardManager', '$timeout', function(keyboardManager, $timeout) {
        return {
            link: function(scope, elem, attrs, ctrl) {
                var hotkey = attrs.sdHotkey,
                    callback = scope.$eval(attrs.sdHotkeyCallback),
                    options = scope.$eval(attrs.sdHotkeyOptions);

                keyboardManager.bind(hotkey, (e) => {
                    e.preventDefault();
                    if (callback) {
                        callback();
                    } else {
                        elem.click();
                    }
                }, options);

                /*
             * On scope $destroy unbind binded shortcuts
             */
                scope.$on('$destroy', () => {
                    keyboardManager.unbind(hotkey);
                });

                $timeout(() => {
                    if (elem.attr('title')) {
                        elem.attr('title', elem.attr('title') + ' (' + hotkey + ')');
                    } else if (elem.attr('tooltip')) {
                        elem.attr('tooltip', elem.attr('tooltip') + ' (' + hotkey + ')');
                    } else {
                        elem.attr('title', hotkey);
                    }
                }, 0, false);
            },
        };
    }])

    .directive('sdKeyboardModal', ['keyboardManager', function(keyboardManager) {
        return {
            scope: true,
            templateUrl: 'scripts/core/keyboard/views/keyboard-modal.html',
            link: function(scope) {
                scope.enabled = false;
                scope.data = {};

                keyboardManager.bind('alt+k', () => {
                    scope.enabled = true;
                    scope.data = keyboardManager.registry;
                }, {
                    global: true,
                    group: gettext('General'),
                    description: gettext('Displays active keyboard shortcuts'),
                });

                keyboardManager.bind('alt+k', () => {
                    scope.enabled = false;
                }, {
                    global: true,
                    type: 'keyup',
                    group: gettext('General'),
                    description: gettext('Displays active keyboard shortcuts'),
                });

                scope.close = function() {
                    scope.enabled = false;
                };
            },
        };
    }]);

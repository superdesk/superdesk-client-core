import _ from 'lodash';
import {gettext} from 'core/utils';

export default angular.module('superdesk.core.keyboard', [])

    .constant('Keys', Object.freeze({
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
    }))

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
                    var character = String.fromCharCode(e.which).toLowerCase(),
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
            var fct, elt, code, k;
            // Initialize options object
            let options = angular.extend({}, defaultOpt, opt);
            let lbl = label.toLowerCase();

            elt = options.target;
            if (typeof options.target === 'string') {
                elt = document.getElementById(options.target);
            }

            const inputDisabled = function(e) {
                if (options.inputDisabled) {
                    var elt;

                    if (e.target) {
                        elt = e.target;
                    } else if (e.srcElement) {
                        elt = e.srcElement;
                    }
                    if (elt.nodeType === 3) {
                        elt = elt.parentNode;
                    }
                    return elt.tagName === 'INPUT' || elt.tagName === 'TEXTAREA' ||
                    elt.className.indexOf('editor-type-html') !== -1;
                }
            };

            const getCharacter = function(code) {
                let character = String.fromCharCode(code).toLowerCase();

                if (code === 188) {
                    character = ',';
                } // If the user presses , when the type is onkeydown
                if (code === 190) {
                    character = '.';
                } // If the user presses , when the type is onkeydown

                return character;
            };

            fct = function keyboardHandler(e = $window.event) {
            // Disable event handler when focus input and textarea
                if (inputDisabled(e)) {
                    return;
                }

                // Find out which key is pressed
                code = e.keyCode || e.which;

                let character = getCharacter(code);

                var keys = lbl.split('+');
                // Key Pressed - counts the number of valid keypresses
                // - if it is same as the number of keys, the shortcut function is invoked
                var kp = 0;
                // Some modifiers key
                var modifiers = {
                    shift: {
                        wanted: false,
                        pressed: !!e.shiftKey,
                    },
                    ctrl: {
                        wanted: false,
                        pressed: !!e.ctrlKey,
                    },
                    alt: {
                        wanted: false,
                        pressed: !!e.altKey,
                    },
                    meta: { // Meta is Mac specific
                        wanted: false,
                        pressed: !!e.metaKey,
                    },
                };

                let computeKeys = () => {
                    let isCtrl = (k) => k === 'ctrl' || k === 'control';
                    let isMeta = (k) => k === 'alt' || k === 'shift' || k === 'meta';

                    // Foreach keys in label (split on +)
                    for (var i = 0, l = keys.length; k = keys[i], i < l; i++) {
                        if (isCtrl(k)) {
                            kp++;
                            modifiers.ctrl.wanted = true;
                        } else if (isMeta(k)) {
                            kp++;
                            modifiers[k].wanted = true;
                        }

                        let shouldIncrease = k.length > 1 && specialKeys[k] === code
                        || options.keyCode && options.keyCode === code || character === k;

                        if (shouldIncrease) {
                            kp++;
                        } else if (shiftNums[character] && e.shiftKey) {
                            // Stupid Shift key bug created by using lowercase
                            character = shiftNums[character];
                            if (character === k) {
                                kp++;
                            }
                        }
                    }
                };

                computeKeys();

                if (kp === keys.length &&
                modifiers.ctrl.pressed === modifiers.ctrl.wanted &&
                modifiers.shift.pressed === modifiers.shift.wanted &&
                modifiers.alt.pressed === modifiers.alt.wanted &&
                modifiers.meta.pressed === modifiers.meta.wanted) {
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

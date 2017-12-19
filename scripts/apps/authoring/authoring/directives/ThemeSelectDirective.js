ThemeSelectDirective.$inject = ['authThemes'];
export function ThemeSelectDirective(authThemes) {
    return {
        templateUrl: 'scripts/apps/authoring/views/theme-select.html',
        scope: {key: '@'},
        link: function themeSelectLink(scope, elem) {
            var DEFAULT_CLASS = 'main-article theme-container';

            scope.themes = authThemes.availableThemes;
            scope.large = {};
            authThemes.get('theme').then((theme) => {
                var selectedTheme = _.find(authThemes.availableThemes, {key: themeKey(theme)});

                scope.theme = selectedTheme;
                scope.large.theme = themeLarge(theme);
                applyTheme('theme');
            });
            authThemes.get('proofreadTheme').then((theme) => {
                var selectedTheme = _.find(authThemes.availableThemes, {key: themeKey(theme)});

                scope.proofreadTheme = selectedTheme;
                scope.large.proofreadTheme = themeLarge(theme);
                applyTheme('proofreadTheme');
            });

            scope.closeModal = function() {
                scope.modalEditorConfig = false;
            }

            /*
             * Changing predefined themes for proofread and normal mode
             *
             * @param {string} key Type of theme (proofread or normal)
             * @param {object} theme New theme
             */
            scope.changeTheme = function(key, theme) {
                scope[key] = theme;
                authThemes.save(key, scope);
                applyTheme(key);
            };

            /*
             * Changing predefined size for proofread and normal mode
             *
             * @param {string} key Type of theme (proofread or normal)
             * @param {object} size New size
             */
            scope.changeSize = function(key, size) {
                scope.large[key] = size;
                authThemes.save(key, scope);
                applyTheme(key);
            };

            /*
             * Applying a theme for currently selected mode
             *
             * @param {string} key Type of theme (proofread or normal)
             */
            function applyTheme(key) {
                if (scope.key === key) {
                    angular.element('.page-content-container')
                        .children('.theme-container')
                        .attr('class', DEFAULT_CLASS)
                        .addClass(scope[key].cssClass)
                        .addClass(scope.large[key] && 'large-text');
                }
            }

            function themeKey(theme) {
                return theme.indexOf('-large') !== -1 ? theme.slice(0, theme.indexOf('-large')) : theme;
            }

            function themeLarge(theme) {
                return theme.indexOf('-large') !== -1;
            }
        }
    };
}

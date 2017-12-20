ThemeSelectDirective.$inject = ['authThemes'];
export function ThemeSelectDirective(authThemes) {
    return {
        templateUrl: 'scripts/apps/authoring/views/theme-select.html',
        scope: {key: '@'},
        link: function themeSelectLink(scope, elem) {
            let DEFAULT_CLASS = 'main-article theme-container';

            scope.themes = authThemes.availableThemes;

            authThemes.get('theme').then((theme) => {
                scope.themePref = theme;
                scope.applyTheme('theme', theme);
            });

            authThemes.get('proofreadTheme').then((theme) => {
                scope.proofredThemePref = theme;
                scope.applyTheme('proofreadTheme', theme);
            });

            /*
             * Color Theme picker
             * @param {string} key Color key
             */
            scope.pickTheme = (themeKey, color) => {
                scope[themeKey].theme = color;
            }

            scope.applyTheme = (key, theme) => {
                if (scope.key !== key) {
                    return false;
                }

                let themeClasses = '';

                angular.forEach(theme, (value, key) => {
                    themeClasses += ' sd-editor--' + key + '-' + value;
                });

                angular.element('.page-content-container')
                    .children('.theme-container')
                    .attr('class', DEFAULT_CLASS)
                    .addClass(themeClasses);
            }

            scope.saveTheme = () => {
                scope.applyTheme('theme', scope.themePref);
                scope.applyTheme('proofreadTheme', scope.proofredThemePref);

                authThemes.save('theme', scope.themePref);
                authThemes.save('proofreadTheme', scope.proofredThemePref);

                return scope.closeModal();
            }

            scope.closeModal = () => {
                return scope.modalEditorConfig = false;
            }
        }
    };
}

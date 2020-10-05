ThemeSelectDirective.$inject = ['authThemes'];
export function ThemeSelectDirective(authThemes) {
    return {
        templateUrl: 'scripts/apps/authoring/views/theme-select.html',
        scope: {key: '@'},
        link: function themeSelectLink(scope, elem) {
            const DEFAULT_CLASS = 'main-article theme-container';

            scope.themes = authThemes.availableThemes;

            authThemes.get('theme').then((theme) => {
                scope.themePref = theme;
                scope.applyTheme('theme', theme);
            });

            authThemes.get('proofreadTheme').then((theme) => {
                scope.proofreadThemePref = theme;
                scope.applyTheme('proofreadTheme', theme);
            });

            /*
             * Color Theme picker
             * @param {string} key Color key
             */
            scope.pickTheme = (themeKey, color) => {
                scope[themeKey].theme = color;
            };

            scope.applyTheme = (key, theme) => {
                if (scope.key !== key) {
                    return false;
                }

                let themeClasses = '';

                angular.forEach(theme, (value, _key) => {
                    themeClasses += ' sd-editor--' + _key + '-' + value;
                });

                angular.element('.page-content-container .theme-container')
                    .attr('class', DEFAULT_CLASS)
                    .addClass(themeClasses);
            };

            scope.saveTheme = () => {
                scope.applyTheme('theme', scope.themePref);
                scope.applyTheme('proofreadTheme', scope.proofreadThemePref);

                authThemes.save('theme', scope.themePref);
                authThemes.save('proofreadTheme', scope.proofreadThemePref);

                return scope.closeModal();
            };

            scope.closeModal = () => scope.modalEditorConfig = false;
        },
    };
}

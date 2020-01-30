export function getAngularService(name) {
    const injector = angular.element(document.body).injector();

    return injector.get(name);
}

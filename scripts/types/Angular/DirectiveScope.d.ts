export interface IDirectiveScope<Model> extends ng.IScope {
    // wrapper is required since two-way binding primitive values doesn't work otherwise
    // https://stackoverflow.com/a/38763654/1175593
    // https://github.com/angular/angular.js/wiki/Understanding-Scopes
    wrapper: Model;

    getDefaults(): Model;
}
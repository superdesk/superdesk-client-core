import {IScope} from 'angular';

export function findParentScope(scope: IScope, predicate: (scope: IScope) => boolean): IScope | null {
    let current = scope.$parent;

    while (current != null) {
        if (predicate(current) === true) {
            return current;
        } else {
            current = current.$parent;
        }
    }
}

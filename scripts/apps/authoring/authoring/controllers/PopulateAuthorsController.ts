import {IArticle} from 'superdesk-interfaces/Article';
import {IRolesService} from 'superdesk-interfaces/UserRole';
import {IAuthor} from 'superdesk-interfaces/Author';
import {ISession} from 'superdesk-interfaces/Session';

interface IScope extends ng.IScope {
    _editable: boolean;

    item: IArticle;

    metadata: {
        authors?: Array<IAuthor>,
    };

    autosave(item: IArticle): any;
}

const isNewItem = (item: IArticle): boolean => item._current_version === 0;

/**
 * It will populate item.authors with current user when item is opened for authoring.
 */
export function PopulateAuthorsController($scope: IScope, roles: IRolesService, session: ISession) {
    if (!$scope._editable) {
        return;
    }

    const stopWatch = $scope.$watch('metadata.authors', (authors: Array<IAuthor>) => {
        if (authors) {
            const itemAuthors = $scope.item.authors || [];

            if (itemAuthors.find((author) => author.parent === session.identity._id)) {
                return; // current user is already in authors
            }

            if (!session.identity.role) {
                return; // no user role to pick default author role
            }

            roles.getUserRole(session.identity.role)
                .then((userRole) => {
                    if (isNewItem($scope.item) && userRole.author_role) {
                        addAuthor(userRole.author_role, itemAuthors);
                    }

                    if (!isNewItem($scope.item) && userRole.editor_role) {
                        addAuthor(userRole.editor_role, itemAuthors);
                    }
                });

            stopWatch(); // it populates value, so just run this once
        }
    });

    function addAuthor(authorRoleId: string, itemAuthors: Array<IAuthor>) {
        const authorRole = $scope.metadata.authors.find(
            (role) => role.role === authorRoleId && role.parent === session.identity._id,
        );

        if (authorRole) {
            $scope.item.authors = itemAuthors.concat([authorRole]);
            $scope.autosave($scope.item);
        }
    }
}

PopulateAuthorsController.$inject = ['$scope', 'roles', 'session'];

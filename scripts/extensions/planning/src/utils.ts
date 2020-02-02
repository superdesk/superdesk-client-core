import {IPlanningAssignmentService} from './interfaces';

export function getAssignmentService(): IPlanningAssignmentService {
    const injector = angular.element(document.body).injector();

    return injector.get('assignments');
}

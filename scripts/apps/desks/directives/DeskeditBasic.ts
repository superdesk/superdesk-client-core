import {limits} from 'apps/desks/constants';
import _ from 'lodash';
import {gettext} from 'core/utils';
import {calculateDiff} from '../controllers/DeskConfigController';

DeskeditBasic.$inject = ['desks', 'WizardHandler', 'metadata', 'config',
    '$filter', 'deployConfig'];
export function DeskeditBasic(desks, WizardHandler, metadata, config,
    $filter, deployConfig) {
    return {
        link: function(scope) {
            scope.limits = limits;
            scope.deskTypes = [];
            scope.saving = false;
            scope.message = null;

            /**
             * Is Published Content Expiry is set
             */
            scope.isPublishedContentExpired = () => deployConfig.getSync('publish_content_expiry_minutes', 0) > 0;

            /**
             * Save desk for adding or editing
             *
             * @param {object} desk
             * @param {boolean} done
             *      when true it exits after saving otherwise
             *      continues to next step in wizard handler.
             */
            scope.save = function(desk, done) {
                scope.saving = true;
                scope.message = gettext('Saving...');
                var _new = !desk._id;

                desks.save(scope.desk.orig, desk).then((res) => {
                    _.merge(scope.desk.edit, res);
                    if (_new) {
                        scope.desks._items.unshift(scope.desk.edit);
                        desks.refreshStages();
                    } else {
                        _.merge(scope.desk.orig, res);
                    }

                    scope.desks._items = $filter('sortByName')(scope.desks._items);
                    desks.deskLookup[scope.desk.edit._id] = scope.desk.edit;

                    if (!done) {
                        WizardHandler.wizard('desks').next();
                    } else {
                        WizardHandler.wizard('desks').finish();
                    }
                }, errorMessage)
                    .finally(() => {
                        scope.saving = false;
                        scope.message = null;
                    });
            };

            function errorMessage(response) {
                scope._error = true;
                scope._errorMessage = gettext('There was a problem, desk not created/updated.');

                if (response.data && response.data._issues) {
                    if (response.data._issues.name && response.data._issues.name.unique) {
                        scope._errorMessage = gettext(
                            'Desk with name {{name}} already exists.', {name: scope.desk.edit.name});
                    } else if (response.data._issues['validator exception']) {
                        scope._errorMessage = gettext(response.data._issues['validator exception']);
                    }
                }
            }

            function clearErrorMessages() {
                if (scope._error || scope._errorLimits) {
                    scope._errorMessage = '';
                    scope._error = null;
                    scope._errorLimits = null;
                    scope.message = null;
                }
            }

            scope.handleEdit = function($event) {
                clearErrorMessages();
                if (!_.isNil(scope.desk.edit.name)) {
                    scope._errorLimits = scope.desk.edit.name.length > scope.limits.desk ? true : null;
                }
            };

            scope.showNoPublishOnAuthoringDesk = function(deskType) {
                return deskType === 'authoring' && config.features.noPublishOnAuthoringDesk;
            };

            scope.$watch('desk.edit', (newVal) => {
                const diff = calculateDiff(scope.desk.edit, scope.desk.orig);

                if (scope.step.current === 'general' && Object.keys(diff).length > 0) {
                    scope.saveEnabled = true;
                } else {
                    scope.saveEnabled = false;
                }
            }, true);

            if (metadata.values.desk_types) {
                scope.deskTypes = metadata.values.desk_types;
            } else {
                metadata.fetchMetadataValues()
                    .then(() => {
                        scope.deskTypes = metadata.values.desk_types;
                    });
            }
        },
    };
}

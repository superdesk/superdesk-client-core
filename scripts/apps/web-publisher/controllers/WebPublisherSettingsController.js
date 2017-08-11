/**
 * @ngdoc controller
 * @module superdesk.apps.web_publisher
 * @name WebPublisherSettingsController
 * @requires publisher
 * @requires https://docs.angularjs.org/api/ng/type/$rootScope.Scope $scope
 * @description WebPublisherSettingsController holds a set of functions used for web publisher settings
 */
WebPublisherSettingsController.$inject = ['$scope', 'publisher', 'modal', 'vocabularies'];
export function WebPublisherSettingsController($scope, publisher, modal, vocabularies) {
    class WebPublisherSettings {
        constructor() {
            this.TEMPLATES_DIR = 'scripts/apps/web-publisher/views';
            this.selectedRule = {};

            publisher.setToken()
                .then(publisher.querySites)
                .then((sites) => {
                    this.sites = sites;
                    // loading routes
                    angular.forEach(this.sites, (siteObj, key) => {
                        publisher.setTenant(siteObj);
                        publisher.queryRoutes({type: 'collection'}).then((routes) => {
                            siteObj.routes = routes;
                        });
                    });

                    this._loadOrganizationRules();
                    this._prepareExpressionBuilder();
                });
        }

        /**
         * @ngdoc method
         * @name WebPublisherSettingsController#changeTab
         * @param {String} newTabName - name of the new active tab
         * @description Sets the active tab name to the given value
         */
        changeTab(newTabName) {
            this.activeTab = newTabName;
        }

        /**
         * @ngdoc method
         * @name WebPublisherSettingsController#toggleCreateRule
         * @param {Boolean} paneOpen - should pane be open
         * @description Opens window for creating new rule
         */
        toggleCreateRule(paneOpen) {
            this.selectedRule = {};
            $scope.newRule = {
                actions: [{}],
                expressions: [{}]
            };
            this.rulePaneOpen = paneOpen;
        }

        /**
         * @ngdoc method
         * @name WebPublisherSettingsController#addRuleAction
         * @description Adds action for new rule
         */
        addRuleAction() {
            $scope.newRule.actions.push({});
        }

        /**
         * @ngdoc method
         * @name WebPublisherSettingsController#addRuleExpression
         * @description Adds expression for new rule
         */
        addRuleExpression() {
            $scope.newRule.expressions.push({});
        }

         /**
         * @ngdoc method
         * @name WebPublisherSettingsController#removeRuleExpression
         * @param {Number} index - index of the item to remove
         * @description Deleting rule expression
         */
        removeRuleExpression(index) {
            $scope.newRule.expressions.splice(index, 1);
        }

         /**
         * @ngdoc method
         * @name WebPublisherSettingsController#previewRule
         * @param {Object} rule - rule which is previewed
         * @description Opens preview pane for selected rule
         */
        previewRule(rule) {
            this.selectedRule = rule;
            this.rulePaneOpen = true;
        }

         /**
         * @ngdoc method
         * @name WebPublisherSettingsController#deleteRule
         * @param {Number} ruleId - id of rule
         * @param {Event} event - angular event
         * @param {Number} index - index of the item to remove
         * @description Deleting organization rule
         */
        deleteRule(ruleId, event, index) {
            event.stopPropagation();
            modal.confirm(gettext('Please confirm you want to delete rule.')).then(
                () => publisher.removeOrganizationRule(ruleId).then(() => {
                    $scope.organizationRules.splice(index, 1);
                })
            );
        }

        /**
         * @ngdoc method
         * @name WebPublisherSettingsController#buildRule
         * @returns {Object}
         * @description Building rule from selected parameters
         */
        buildRule() {
            let newRule = {
                name: $scope.newRule.name,
                description: $scope.newRule.description,
                priority: 1,
                expression: '',
                configuration: [{
                    key: 'destinations',
                    value: []
                }]
            };

            _.each($scope.newRule.expressions, (expression, index) => {
                if (index > 0) {
                    newRule.expression += ' and ';
                }
                newRule.expression += expression.option.value + ' ' + expression.operator;
                if (expression.option.type === 'number') {
                    newRule.expression += ' ' + expression.value;
                } else {
                    newRule.expression += ' "' + expression.value + '"';
                }
            });

            _.each($scope.newRule.actions, (action) => {
                let configuration = {
                    tenant: action.tenant.code,
                    route: action.route,
                    fbia: action.fbia ? 'true' : 'false'
                };

                newRule.configuration[0].value.push(configuration);
            });
            return newRule;
        }

        /**
         * @ngdoc method
         * @name WebPublisherSettingsController#saveRule
         * @description Saving rule
         */
        saveRule() {
            let newRule = this.buildRule();
            // not necessary at the moment but will be usefull for editing rule in future
            let updatedKeys = this._updatedKeys(newRule, this.selectedRule);

            publisher.manageOrganizationRule({rule: _.pick(newRule, updatedKeys)}, this.selectedRule.id)
                .then((rule) => {
                    this.rulePaneOpen = false;
                    this._loadOrganizationRules();
                });
        }

        /**
         * @ngdoc method
         * @name WebPublisherSettingsController#isObjEmpty
         * @param {Object} value
         * @returns {Boolean}
         * @description Checks if object is empty
         */
        isObjEmpty(value) {
            return angular.equals({}, value);
        }

        /**
         * @ngdoc method
         * @name WebPublisherSettingsController#_loadOrganizationRules
         * @description Loads Organization Rules
         */
        _loadOrganizationRules() {
            publisher.queryOrganizationRules()
                .then((rules) => {
                    $scope.organizationRules = rules;
                });
        }

        /**
         * @ngdoc method
         * @name WebPublisherSettingsController#_prepareExpressionBuilder
         * @description Prepares expression builder config
         */
        _prepareExpressionBuilder() {
            this.expressionBuilder = {
                options: [
                    {name: 'Language', value: 'package.getLanguage()', type: 'string'},
                    {name: 'Category', value: 'package.getServices()[0]["name"]', type: 'category'},
                    {name: 'Author', value: 'package.getByline()', type: 'string'},
                    {name: 'Ingest Source', value: 'package.getSource()', type: 'string'},
                    {name: 'Priority', value: 'package.getPriority()', type: 'number'},
                    {name: 'Urgency', value: 'package.getUrgency()', type: 'number'},
                ],
                operators: {
                    string: [
                        {name: '=', value: '=='},
                        {name: '!=', value: '!='}
                    ],
                    number: [
                        {name: '=', value: '=='},
                        {name: '!=', value: '!='},
                        {name: '<', value: '<'},
                        {name: '>', value: '>'},
                        {name: '<=', value: '<='},
                        {name: '>=', value: '>='}
                    ],
                    category: [
                        {name: '=', value: 'matches'},
                    ]
                }
            };

            vocabularies.getAllActiveVocabularies().then((result) => {
                _.each(result._items, (vocabulary) => {
                    if (vocabulary._id === 'categories') {
                        this.expressionBuilder.categories = vocabulary.items;
                    }
                });
            });
        }

        /**
         * @ngdoc method
         * @name WebPublisherSettingsController#_updatedKeys
         * @private
         * @param {Object} a
         * @param {Object} b
         * @returns {Array}
         * @description Compares 2 objects and returns keys of fields that are updated
         */
        _updatedKeys(a, b) {
            return _.reduce(a, (result, value, key) => _.isEqual(value, b[key]) ? result : result.concat(key), []);
        }

    }

    return new WebPublisherSettings();
}

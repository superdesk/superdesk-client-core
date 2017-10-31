ContactEditDirective.$inject = ['contacts', 'gettext', 'notify', 'lodash',
    'asset', 'privileges', 'metadata', '$filter'];
export function ContactEditDirective(contacts, gettext, notify, _, asset,
    privileges, metadata, $filter) {
    return {
        templateUrl: asset.templateUrl('apps/contacts/views/edit-form.html'),
        scope: {
            origContact: '=contact',
            oncancel: '&'
        },
        link: function(scope, elem) {
            scope.privileges = privileges.privileges;
            scope.twitterPattern = contacts.twitterPattern;

            const fbUrl = 'https://www.facebook.com/';
            const igUrl = 'https://www.instagram.com/';

            scope.requiredField = true;
            scope.lookupFields = ['mobile', 'phone', 'email', 'twitter', 'facebook', 'instagram'];

            var orig = {};

            scope.contact = {};

            scope.$watch('origContact', () => {
                orig = angular.copy(scope.origContact);
                resetContact(orig);
                scope.contact = _.create(orig);
                scope.display_name = orig.first_name ? orig.first_name + ' ' +
                    orig.last_name : orig.organisation;

                if (orig.facebook) {
                    scope.contact.facebook = _.replace(orig.facebook, fbUrl, '');
                }

                if (orig.instagram) {
                    scope.contact.instagram = _.replace(orig.instagram, igUrl, '');
                }

                scope.displayOther = _.isNil(orig.state) ||
                    !_.findKey(scope.stateNames, (m) => m.qcode === orig.state);
            });

            function isDirty(contact, origContact) {
                var cloneOrig = _.cloneDeep(origContact);

                if (orig.facebook) {
                    cloneOrig.facebook = _.replace(orig.facebook, fbUrl, '');
                }

                if (orig.instagram) {
                    cloneOrig.instagram = _.replace(orig.instagram, igUrl, '');
                }

                return !angular.equals(contact, cloneOrig);
            }

            scope.$watch('contact', (contact) => {
                scope.requiredField = !validate(contact);

                if (isDirty(contact, scope.origContact)) {
                    scope.contactForm.$setDirty();
                }
            }, true);

            metadata.initialize().then(() => {
                scope.metadata = metadata.values;
                initStates();
            });

            function initStates() {
                if (angular.isDefined(scope.metadata.contact_states)) {
                    scope.stateNames = $filter('sortByName')(scope.metadata.contact_states);
                    scope.stateNames.push({name: 'Other'});
                }
            }

            // Validate if at least one of field in lookupFields is supplied.
            function validate(contact) {
                return _.some(scope.lookupFields, (field) => !_.isEmpty(contact[field]));
            }

            scope.save = function() {
                notify.info(gettext('Saving...'));

                var diffContact = _.cloneDeep(scope.contact);

                if (diffContact.facebook) {
                    diffContact.facebook = fbUrl + scope.contact.facebook;
                }

                if (diffContact.instagram) {
                    diffContact.instagram = igUrl + scope.contact.instagram;
                }

                return contacts.save(scope.origContact, diffContact)
                    .then((response) => {
                        scope.origContact = response;
                        resetContact(scope.origContact);
                        notify.pop();
                        notify.success(gettext('contact saved.'));
                    }, (response) => {
                        notify.pop();

                        var errorMessage = gettext('There was an error when saving the contact.');

                        if (response.data && response.data._issues) {
                            if (angular.isDefined(response.data._issues['validator exception'])) {
                                errorMessage = gettext('Error: ' + response.data._issues['validator exception']);
                            }

                            for (var field in response.data._issues) {
                                validateField(response, field);
                            }
                        }

                        notify.error(errorMessage);
                    });
            };

            scope.toggleStatus = function(active) {
                scope.contact.is_active = active;
            };

            scope.togglePublic = function(isPublic) {
                scope.contact.public = isPublic;
            };

            function resetContact(contact) {
                scope.display_name = scope.origContact.first_name ? scope.origContact.first_name + ' ' +
                    scope.origContact.last_name : scope.origContact.organisation;
                scope.contactForm.$setPristine();
            }

            scope.updateState = function(stateName) {
                scope.displayOther = _.isNil(stateName);
            };

            scope.updateUsage = function(usage, field, index) {
                if (usage === 'Confidential') {
                    scope.contact[field][index].public = false;
                }
            };

            scope.addField = function(field) {
                scope.contact[field] = scope.contact[field] || [];

                if (_.includes(['phone', 'mobile'], field)) {
                    scope.contact[field] = angular.extend(scope.contact[field],
                        scope.contact[field].push({number: '', usage: ''}));
                } else {
                    scope.contact[field] = angular.extend(scope.contact[field],
                        scope.contact[field].push(''));
                }
            };

            scope.removeField = function(field, value) {
                scope.contact[field] = _.without(scope.contact[field], value);
            };

            scope.cancel = function() {
                resetContact(scope.origContact);
                scope.contact = {};
                scope.oncancel();
            };
            function validateField(response, field) {
                if (scope.contactForm[field]) {
                    for (var constraint in response.data._issues[field]) {
                        if (response.data._issues[field][constraint]) {
                            scope.contactForm[field].$setValidity(constraint, false);
                            scope.error.message = null;
                        }
                    }
                }
            }
        }
    };
}

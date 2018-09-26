/* eslint-disable react/no-render-return-value */

import React from 'react';
import ReactDOM from 'react-dom';
import {replaceUrls} from '../../contacts/helpers';
import {ContactFormContainer as ContactFormContainerComponent} from '../../contacts/components/Form';

ContactEditorDirective.$inject = [
    'contacts',
    'gettext',
    'notify',
    'privileges',
    'metadata',
    '$filter',
    'Keys',
    '$rootScope',
    'lodash',
];

export function ContactEditorDirective(
    contacts,
    gettext,
    notify,
    privileges,
    metadata,
    $filter,
    Keys,
    $rootScope,
    _
) {
    // contains all the injected services to be passed down to child
    // components via props
    const services = {
        contacts: contacts,
        gettext: gettext,
        notify: notify,
        privileges: privileges,
        metadata: metadata,
    };

    return {
        scope: {
            origContact: '=contact',
            oncancel: '&',
        },
        link: function(scope, elem) {
            scope.onCancel = function() {
                scope.$applyAsync(() => {
                    scope.oncancel();
                });
            };

            var contactFormContainer = React.createElement(ContactFormContainerComponent,
                angular.extend({
                    svc: services,
                    contact: scope.origContact,
                    onCancel: scope.onCancel,
                })
            );

            var contactFormComponent = ReactDOM.render(contactFormContainer, elem[0]);

            scope.$watch('origContact', () => {
                const origContact = replaceUrls(scope.origContact);

                contactFormComponent.setState({
                    originalContact: origContact,
                    currentContact: origContact,
                });
            });

            // remove react elem on destroy
            scope.$on('$destroy', () => {
                elem.off();
                ReactDOM.unmountComponentAtNode(elem[0]);
            });
        },
    };
}

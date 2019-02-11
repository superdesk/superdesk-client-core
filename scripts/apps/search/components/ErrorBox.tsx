import React from 'react';
import {gettext} from 'core/utils';

export const ErrorBox: React.StatelessComponent<any> = (props) =>
    React.createElement('div', {className: 'error-box'},
        React.createElement('p', {className: 'message'},
            gettext('There was an error archiving this item')),
        React.createElement('div', {className: 'buttons'}),
    );

ErrorBox.propTypes = {
};

import {IArticle} from 'superdesk-api';
import React from 'react';
import PropTypes from 'prop-types';
import {createMarkUp} from '../../helpers';

export function slugline(props: {item: IArticle}) {
    if (props.item.slugline) {
        return (
            <span
                key="slugline"
                className="field--slugline"
                dangerouslySetInnerHTML={createMarkUp(props.item.slugline)}
                data-test-id="field--slugline"
            />
        );
    } else {
        return null;
    }
}

slugline['propTypes'] = {
    item: PropTypes.object,
};

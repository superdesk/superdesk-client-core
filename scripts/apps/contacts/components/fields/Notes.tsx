import React from 'react';
import PropTypes from 'prop-types';
import {truncate} from 'lodash';

export const Notes: React.StatelessComponent<any> = ({item, svc}) => {
    const {gettextCatalog} = svc;
    const notes = gettextCatalog.getString(item.notes);
    const displayNotes = truncate(notes, {length: 120});

    return (
        <div key="notes">
            {notes &&
                <span title={notes}>
                    {displayNotes}
                </span>
            }
        </div>
    );
};

Notes.propTypes = {
    item: PropTypes.object,
    svc: PropTypes.object.isRequired,
};

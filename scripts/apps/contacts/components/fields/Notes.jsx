import React from 'react';
import PropTypes from 'prop-types';

export const Notes = ({item, svc}) => {
    const {gettextCatalog, $filter} = svc;
    let notes = gettextCatalog.getString(item.notes);
    let displayNotes = $filter('truncateString')(notes, 250);

    return (
        <div key="notes" className="item-notes">
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
    svc: PropTypes.object.isRequired
};

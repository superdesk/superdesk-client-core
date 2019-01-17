import React from 'react';
import PropTypes from 'prop-types';
import {truncate} from 'lodash';
import {gettext} from 'core/ui/components/utils';

export const Notes: React.StatelessComponent<any> = ({item}) => {
    const notes = gettext(item.notes);
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
};

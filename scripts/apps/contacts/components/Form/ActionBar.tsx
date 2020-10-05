import React from 'react';
import PropTypes from 'prop-types';
import {gettext} from 'core/utils';

export const ActionBar: React.StatelessComponent<any> = ({svc, readOnly, dirty, valid, onSave, onCancel}) => (
    <div className="action-bar clearfix show">
        <span className="pull-right">
            <button
                id="cancel-edit-btn"
                type="button"
                className="btn"
                onClick={onCancel}
            >
                {gettext('Cancel')}
            </button>

            {!readOnly && (
                <button
                    id="save-edit-btn"
                    type="button"
                    className="btn btn--primary"
                    onClick={onSave}
                    disabled={!valid || !dirty}
                >
                    {gettext('Save')}
                </button>
            )}
        </span>
    </div>
);

ActionBar.propTypes = {
    svc: PropTypes.object.isRequired,
    onSave: PropTypes.func,
    onCancel: PropTypes.func,
    readOnly: PropTypes.bool,
    dirty: PropTypes.bool,
    valid: PropTypes.bool,
};

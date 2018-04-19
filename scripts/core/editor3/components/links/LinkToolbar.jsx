import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import classNames from 'classnames';

import * as actions from '../../actions';
import {getSelectedEntityType, getSelectedEntityData} from '../links/entityUtils';

export class LinkToolbarComponent extends Component {
    render() {
        const {editorState, onEdit, removeLink} = this.props;
        const {link} = getSelectedEntityData(editorState);
        const isLink = getSelectedEntityType(editorState) === 'LINK';
        const cx = classNames({
            dropdown: true,
            'link-toolbar': true,
            'is-link': isLink,
        });

        return <div className={cx}>
            {!isLink ? <span>&nbsp;</span> :
                <span>
                    {gettext('Link controls:')}
                    {link && link.href ? <a href={link.href} target="_blank">{gettext('Open')}</a> : null}
                    <a onClick={() => onEdit(link)}>{gettext('Edit')}</a>
                    <a onClick={removeLink}>{gettext('Delete')}</a>
                </span>}
        </div>;
    }
}

LinkToolbarComponent.propTypes = {
    editorState: PropTypes.object,
    removeLink: PropTypes.func,
    onEdit: PropTypes.func,
};

const mapStateToProps = (state) => ({
    editorState: state.editorState,
});

const mapDispatchToProps = (dispatch) => ({
    removeLink: () => dispatch(actions.removeLink()),
});

export const LinkToolbar = connect(mapStateToProps, mapDispatchToProps)(LinkToolbarComponent);

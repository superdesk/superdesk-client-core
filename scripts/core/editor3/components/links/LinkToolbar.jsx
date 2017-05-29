import React, {Component} from 'react';
import * as actions from '../../actions';
import {connect} from 'react-redux';
import {getSelectedEntityType, getSelectedEntityData} from '../links/entityUtils';
import classNames from 'classnames';

export class LinkToolbarComponent extends Component {
    render() {
        const {editorState, onEdit, removeLink} = this.props;
        const {url} = getSelectedEntityData(editorState);
        const isLink = getSelectedEntityType(editorState) === 'LINK';
        const cx = classNames({
            'link-toolbar': true,
            empty: !isLink
        });

        return <div className={cx}>
            {!isLink ? <span>&nbsp;</span> :
                <span>
                    {gettext('Link controls:')}
                    <a href={url} target="_blank">Open</a>
                    <a onClick={() => onEdit(url)}>Edit</a>
                    <a onClick={removeLink}>Delete</a>
                </span>}
        </div>;
    }
}

LinkToolbarComponent.propTypes = {
    editorState: React.PropTypes.object,
    removeLink: React.PropTypes.func,
    onEdit: React.PropTypes.func
};

const mapStateToProps = (state) => ({
    editorState: state.editorState
});

const mapDispatchToProps = (dispatch) => ({
    removeLink: () => dispatch(actions.removeLink())
});

export const LinkToolbar = connect(mapStateToProps, mapDispatchToProps)(LinkToolbarComponent);

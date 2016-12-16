import React, {Component} from 'react';
import {RichUtils, Entity} from 'draft-js';
import classNames from 'classnames';

export default class LinkControl extends Component {
    constructor(props) {
        super(props);

        this.isContentSelected = this.isContentSelected.bind(this);
        this.onClick = this.onClick.bind(this);
        this.applyLinkToSelection = this.applyLinkToSelection.bind(this);
    }

    isContentSelected() {
        const {editorState} = this.props;
        const selection = editorState.getSelection();

        return selection.getEndOffset() - selection.getStartOffset() !== 0;
    }

    applyLinkToSelection(url) {
        const {onChange, editorState} = this.props;

        const entityKey = Entity.create('LINK', 'MUTABLE', {url});
        const stateAfterChange = RichUtils.toggleLink(
            editorState,
            editorState.getSelection(),
            entityKey
        );

        onChange(stateAfterChange);
    }

    onClick() {
        if (!this.isContentSelected()) {
            return;
        }

        // TODO(gbbr): implement a reusable pop-up as pare of core
        // eslint-disable-next-line no-alert
        const url = prompt('Enter a URL');

        if (url) {
            this.applyLinkToSelection(url);
        }
    }

    render() {
        const cx = classNames({
            'Editor3-styleButton': true,
            inactive: !this.isContentSelected()
        });

        return <span className={cx} onClick={this.onClick}>link</span>;
    }
}

LinkControl.propTypes = {
    editorState: React.PropTypes.object.isRequired,
    onChange: React.PropTypes.func.isRequired
};

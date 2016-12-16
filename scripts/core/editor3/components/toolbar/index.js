import React, {Component} from 'react';
import BlockStyleControls from './BlockStyleControls';
import InlineStyleControls from './InlineStyleControls';
import LinkControl from './LinkControl';

export default class Toolbar extends Component {
    render() {
        const {editorState, editorFormat, onChange} = this.props;

        return (
            <div className="Editor3-controls">
                <BlockStyleControls
                    editorState={editorState}
                    options={editorFormat}
                    onChange={onChange}
                />

                <InlineStyleControls
                    editorState={editorState}
                    options={editorFormat}
                    onChange={onChange}
                />

                <LinkControl
                    editorState={editorState}
                    onChange={onChange}
                />
            </div>
        );
    }
}

Toolbar.propTypes = {
    editorState: React.PropTypes.object.isRequired,
    editorFormat: React.PropTypes.array.isRequired,
    onChange: React.PropTypes.func.isRequired
};

import {EditorState} from 'draft-js';
import React from 'react';

import {autocomplete} from '../actions/editor3';
import {AutocompleteSuggestions} from '../../ui/components/AutoCompleteSuggestions';
import {PortalWithoutEvents} from '../../ui/components/PortalWithoutEvents';

interface IProps {
    autocompleteSuggestions?: Array<string>;
    editorState: EditorState;
    editorNode: HTMLElement;
    className: string;
    dispatch(action): void;
}

export class Editor3Autocomplete extends React.PureComponent<IProps> {
    render() {
        const editorText = this.props.editorState.getCurrentContent().getPlainText().toLowerCase().trim();

        const suggestions = (this.props.autocompleteSuggestions ?? []).filter(
            (name) => name.toLowerCase().includes(editorText) && name.toLowerCase() !== editorText,
        );

        return (
            <div>
                {
                    suggestions.length > 0 && (
                        <PortalWithoutEvents
                            component={AutocompleteSuggestions}
                            props={{
                                referenceNode: this.props.editorNode,
                                items: suggestions,
                                onClick: (item) => {
                                    this.props.dispatch(autocomplete(item));
                                },
                                className: this.props.className,
                            }}
                        />
                    )
                }
            </div>
        );
    }
}

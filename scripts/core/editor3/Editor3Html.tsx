import * as React from 'react';

import {IEditor3HtmlProps} from 'superdesk-api';
import {RawDraftContentState, convertToRaw, ContentState, convertFromRaw} from 'draft-js';
import {Editor3Standalone} from './react';

import {getContentStateFromHtml} from './html/from-html';
import {editor3StateToHtml} from './html/to-html/editor3StateToHtml';

interface IState {
    rawDraftContentState: RawDraftContentState;
}

function getRawDraftContentStateFromString(input?: string): RawDraftContentState {
    return typeof input === 'string' && input.trim().length > 0
        ? convertToRaw(getContentStateFromHtml(input))
        : convertToRaw(ContentState.createFromText(''));
}

export class Editor3Html extends React.Component<IEditor3HtmlProps, IState> {
    constructor(props: IEditor3HtmlProps) {
        super(props);

        this.state = {
            rawDraftContentState: getRawDraftContentStateFromString(this.props.value),
        };

        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(rawDraftContentState: RawDraftContentState): void {
        this.setState({rawDraftContentState});
        this.props.onChange(editor3StateToHtml(convertFromRaw(rawDraftContentState)));
    }

    componentDidUpdate(prevProps: Readonly<IEditor3HtmlProps>) {
        // draft-js convertFromHTML method removes the blank lines
        // for ex: "<p><br></p><p>hello</p>" will get converted to "<p>Hello</p>"
        // due to this props value never matches HTML created from state.rawDraftContentState
        // So, to avoid infinite loop match prevProps.value with current props.value as well
        if (this.props.value !== prevProps.value
            && this.props.value !== editor3StateToHtml(convertFromRaw(this.state.rawDraftContentState))) {
            // This component holds it's own state which is derived from props
            // internal state is reloaded when it doesn't match with what's in the props
            // holding own state is required to prevent infinite loops which would happen because
            // draftjs keys change every time content state is created from HTML

            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({rawDraftContentState: getRawDraftContentStateFromString(this.props.value)});
        }
    }

    render() {
        return (
            <Editor3Standalone
                scrollContainer={this.props.scrollContainer ?? 'window'}
                onChange={this.handleChange}
                editorFormat={this.props.editorFormat ?? ['bold', 'italic', 'underline', 'link']}
                rawDraftContentState={this.state.rawDraftContentState}
                readOnly={this.props.readOnly}
            />
        );
    }
}

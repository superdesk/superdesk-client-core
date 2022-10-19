import React from 'react';
import {IconButton} from 'superdesk-ui-framework/react/components/IconButton';
import {Button, Icon, Label} from 'superdesk-ui-framework';
import {Spacer} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';
import {IMacro} from 'superdesk-interfaces/Macro';
import {addEditorEventListener, dispatchEditorEvent} from '../authoring-react-editor-events';
import {highlightDistinctMatches} from './macros';
import {editorId} from '../article-widgets/find-and-replace';

interface IProps {
    currentMacro: IMacro;
}

interface IState {
    replaceTarget: string | null;
    replaceValue: string | null;
}

export class InteractiveMacrosDisplay extends React.PureComponent<IProps, IState> {
    private eventListenerToRemoveBeforeUnmounting: () => void;
    private isAwaitingSelectionIndex: boolean;

    constructor(props: IProps) {
        super(props);

        this.state = {
            replaceTarget: null,
            replaceValue: null,
        };
        this.eventListenerToRemoveBeforeUnmounting = () => null;
        this.replaceMatch = this.replaceMatch.bind(this);
        this.goToNextMatchingValue = this.goToNextMatchingValue.bind(this);
        this.goToPrevMatchingValue = this.goToPrevMatchingValue.bind(this);
        this.requestSelectionIndex = this.requestSelectionIndex.bind(this);

        this.isAwaitingSelectionIndex = false;
    }

    goToNextMatchingValue() {
        dispatchEditorEvent('find_and_replace__find_next', {editorId});
        this.requestSelectionIndex();
    }

    goToPrevMatchingValue() {
        dispatchEditorEvent('find_and_replace__find_prev', {editorId});
        this.requestSelectionIndex();
    }

    requestSelectionIndex() {
        this.isAwaitingSelectionIndex = true;
        dispatchEditorEvent('find_and_replace__request_for_current_selection_index', null);
    }

    replaceMatch(callback: () => void) {
        dispatchEditorEvent('find_and_replace__replace', {
            editorId,
            replaceWith: this.state.replaceValue,
            replaceAllMatches: false,
        });
        setTimeout(callback);
    }

    componentDidMount(): void {
        this.eventListenerToRemoveBeforeUnmounting =
            addEditorEventListener('find_and_replace__receive_current_selection_index', (event) => {
                // we only request selection index when we want to do the replacing
                // the `if` below also checks if the same class instance requested the replacing
                if (event.detail.editorId === editorId && this.isAwaitingSelectionIndex) {
                    this.setState({
                        replaceValue: Object.values(this.props.currentMacro.diff).at(event.detail.selectionIndex),
                        replaceTarget: Object.keys(this.props.currentMacro.diff).at(event.detail.selectionIndex),
                    }, () => {
                        this.goToNextMatchingValue();
                    });

                    this.isAwaitingSelectionIndex = false;
                }
            });
    }

    componentWillUnmount() {
        this.eventListenerToRemoveBeforeUnmounting();
    }

    render(): React.ReactNode {
        return (
            <Spacer v gap="16" noGrow>
                <Spacer v gap="4">
                    <Label
                        text={this.props.currentMacro.label}
                        size="large"
                        style="hollow"
                    />
                    <Label
                        style="translucent"
                        size="large"
                        text={`Number of matches: ${Object.keys(this.props.currentMacro.diff).length}`}
                    />
                </Spacer>
                {
                    <Spacer v gap="16">
                        <Spacer h gap="4" noGrow justifyContent="start">
                            <IconButton
                                ariaValue={gettext('Previous match')}
                                onClick={() => {
                                    this.goToPrevMatchingValue();
                                }}
                                icon="chevron-left-thin"
                            />
                            <IconButton
                                ariaValue={gettext('Next match')}
                                onClick={() => {
                                    this.goToNextMatchingValue();
                                }}
                                icon="chevron-right-thin"
                            />
                            <Button
                                text={gettext('Replace')}
                                onClick={() => {
                                    this.replaceMatch(() => highlightDistinctMatches(this.props.currentMacro.diff));
                                }}
                            />
                        </Spacer>
                        {this.state.replaceTarget != null && (
                            <Spacer h gap="8" noGrow justifyContent="start">
                                <Label size="large" text={this.state.replaceTarget} />
                                <Icon name="arrow-right" />
                                <Label size="large" text={this.state.replaceValue} />
                            </Spacer>
                        )}
                    </Spacer>
                }
            </Spacer>
        );
    }
}

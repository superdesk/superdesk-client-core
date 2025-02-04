import React from 'react';
import {IconButton} from 'superdesk-ui-framework/react/components/IconButton';
import {Button, Icon, Label, Text, Container} from 'superdesk-ui-framework/react';
import {ContentDivider} from 'superdesk-ui-framework/react/components/ContentDivider';
import {Spacer} from 'core/ui/components/Spacer';
import {gettext} from 'core/utils';
import {IMacro} from 'superdesk-interfaces/Macro';
import {addEditorEventListener, dispatchEditorEvent} from '../authoring-react-editor-events';
import {highlightDistinctMatches} from './macros';
import {editorId} from '../article-widgets/find-and-replace';

interface IProps {
    currentMacro: IMacro;
    onClose(): void;
}

interface IState {
    replaceTarget: string | null;
    replaceValue: string | null;
    currentSelectionIndex: number | null;
}

export class InteractiveMacrosDisplay extends React.PureComponent<IProps, IState> {
    private eventListenerToRemoveBeforeUnmounting: () => void;
    private isAwaitingSelectionIndex: boolean;

    constructor(props: IProps) {
        super(props);

        this.state = {
            replaceTarget: null,
            replaceValue: null,
            currentSelectionIndex: null,
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
                        currentSelectionIndex: event.detail.selectionIndex + 1,
                        replaceValue: Object.values(this.props.currentMacro.diff)[event.detail.selectionIndex],
                        replaceTarget: Object.keys(this.props.currentMacro.diff)[event.detail.selectionIndex],
                    });
                    this.isAwaitingSelectionIndex = false;
                }
            });

        highlightDistinctMatches(this.props.currentMacro.diff);
        this.goToNextMatchingValue();
    }

    componentWillUnmount() {
        this.eventListenerToRemoveBeforeUnmounting();
    }

    render(): React.ReactNode {
        return (
            <Container>
                <Spacer v gap="8">
                    <Button
                        expand
                        onClick={() => null}
                        disabled
                        text={this.props.currentMacro.label}
                        size="large"
                        style="hollow"
                    />
                    <Spacer h gap="4" justifyContent="start">
                        <Text weight="medium">
                            {gettext(
                                '{{n}} of {{total}} matches',
                                {
                                    n: this.state.currentSelectionIndex,
                                    total: Object.keys(this.props.currentMacro.diff).length,
                                })}
                        </Text>
                        <Spacer h gap="4" justifyContent="end" noGrow>
                            <IconButton
                                ariaValue={gettext('Next match')}
                                onClick={() => {
                                    this.goToNextMatchingValue();
                                }}
                                size="default"
                                icon="chevron-down-thin"
                            />
                            <IconButton
                                ariaValue={gettext('Previous match')}
                                onClick={() => {
                                    this.goToPrevMatchingValue();
                                }}
                                size="default"
                                icon="chevron-up-thin"
                            />
                        </Spacer>
                    </Spacer>
                    {this.state.replaceTarget != null && (
                        <>
                            <ContentDivider type="dotted" margin="x-small" />
                            <Spacer
                                h
                                gap="4"
                                justifyContent="start"
                                noGrow
                                alignItems="center"
                                style={{flexWrap: 'wrap'}}
                            >
                                <Label size="large" text={this.state.replaceTarget} />
                                <Icon name="arrow-right" size="small" />
                                <Label size="large" text={this.state.replaceValue} />
                            </Spacer>
                            <ContentDivider type="dotted" margin="x-small" />
                        </>
                    )}
                    <Spacer h gap="4" justifyContent="end" noGrow>
                        <Button
                            style="hollow"
                            text={gettext('Cancel')}
                            onClick={() => {
                                highlightDistinctMatches({});
                                this.props.onClose();
                            }}
                        />
                        <Button
                            style="hollow"
                            type="primary"
                            text={gettext('Replace')}
                            onClick={() => {
                                this.replaceMatch(() => highlightDistinctMatches(this.props.currentMacro.diff));
                            }}
                        />
                    </Spacer>
                </Spacer>
            </Container>
        );
    }
}

import React from 'react';
import {showModal} from '@sourcefabric/common';
import {Button, ButtonGroup, Modal} from 'superdesk-ui-framework/react';
import {IArticleSideWidget, ISideWidgetConfigurationProps} from 'superdesk-api';
import {gettext} from 'core/utils';

interface IConfigurationContext {
    widgetLabel: string;
    component: React.ComponentType<ISideWidgetConfigurationProps<any>>;
    configuration: any;
    onSave(configuration: any): void;
}

/**
 * Set by {@link SideWidgetConfigurationProvider} for the widget currently rendered in the side
 * panel, and read by the widget heading, which is rendered by the widget itself and so can not be
 * handed the configuration as a prop.
 */
export const SideWidgetConfigurationContext = React.createContext<IConfigurationContext | null>(null);

interface IProps {
    widget: IArticleSideWidget;
    children(configuration: any): JSX.Element;
}

interface IState {
    widgetId: IArticleSideWidget['_id'];
    configuration: any;
}

/**
 * Owns the configuration of a side widget: hands the current value to the widget and the means to
 * change it to the widget heading. Only meaningful for a widget that declares `configuration`.
 */
export class SideWidgetConfigurationProvider extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {
            widgetId: props.widget._id,
            configuration: props.widget.configuration.getInitialConfiguration(),
        };
    }

    // switching between two configurable widgets reuses this instance, and the second one must
    // not be handed the configuration of the first
    static getDerivedStateFromProps(props: IProps, state: IState): IState | null {
        if (props.widget._id === state.widgetId) {
            return null;
        }

        return {
            widgetId: props.widget._id,
            configuration: props.widget.configuration.getInitialConfiguration(),
        };
    }

    render(): JSX.Element {
        const {widget} = this.props;

        return (
            <SideWidgetConfigurationContext.Provider
                value={{
                    widgetLabel: widget.label,
                    component: widget.configuration.component,
                    configuration: this.state.configuration,
                    onSave: (configuration) => {
                        widget.configuration.onSave?.(configuration);

                        this.setState({configuration});
                    },
                }}
            >
                {this.props.children(this.state.configuration)}
            </SideWidgetConfigurationContext.Provider>
        );
    }
}

interface IModalProps extends IConfigurationContext {
    closeModal(): void;
}

interface IModalState {
    configuration: any;
}

class SideWidgetConfigurationModal extends React.PureComponent<IModalProps, IModalState> {
    constructor(props: IModalProps) {
        super(props);

        this.state = {configuration: props.configuration};
    }

    render(): JSX.Element {
        const {closeModal} = this.props;
        const ConfigurationComponent = this.props.component;

        return (
            <Modal
                visible
                size="small"
                position="center"
                headerTemplate={gettext('{{widget}} configuration', {widget: this.props.widgetLabel})}
                data-test-id="side-widget-configuration-modal"
                onHide={closeModal}
                footerTemplate={(
                    <ButtonGroup align="end">
                        <Button
                            text={gettext('Cancel')}
                            onClick={closeModal}
                            data-test-id="side-widget-configuration-cancel"
                        />
                        <Button
                            text={gettext('Save')}
                            type="primary"
                            onClick={() => {
                                this.props.onSave(this.state.configuration);
                                closeModal();
                            }}
                            data-test-id="side-widget-configuration-save"
                        />
                    </ButtonGroup>
                )}
            >
                <ConfigurationComponent
                    configuration={this.state.configuration}
                    onChange={(configuration) => {
                        this.setState({configuration});
                    }}
                />
            </Modal>
        );
    }
}

export function showSideWidgetConfigurationModal(context: IConfigurationContext): void {
    showModal(({closeModal}) => (
        <SideWidgetConfigurationModal {...context} closeModal={closeModal} />
    ));
}

import * as React from 'react';
import {IEditorComponentProps, IPlainTextFieldConfig, IPlainTextFieldValueOperational} from 'superdesk-api';
import {IconButton, Input} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';

type IProps = IEditorComponentProps<IPlainTextFieldValueOperational, IPlainTextFieldConfig, never>;

interface IState {
    locked: boolean;
}

export class Editor extends React.PureComponent<IProps, IState> {
    constructor(props: IProps) {
        super(props);

        this.state = {locked: props.config.lockable === true};
    }

    render() {
        const Container = this.props.container;
        const {config, readOnly, value} = this.props;
        const lockable = config.lockable === true;
        const showValueOnly = readOnly || (lockable && this.state.locked);
        const HelperComponent = config.helperComponent;

        const lockButton = lockable && !readOnly && (
            <span data-test-id="plain-text-lock">
                <IconButton
                    icon={this.state.locked ? 'lock' : 'unlocked'}
                    ariaValue={gettext('Toggle lock')}
                    size="small"
                    onClick={() => {
                        this.setState({locked: !this.state.locked});
                    }}
                />
            </span>
        );

        return (
            <Container labelActions={lockButton || undefined}>
                {
                    showValueOnly
                        ? <div data-test-id="plain-text-value">{value}</div>
                        : (
                            <Input
                                inlineLabel
                                labelHidden
                                type="text"
                                label=""
                                value={value ?? ''}
                                maxLength={config.maxLength}
                                onChange={(val) => {
                                    this.props.onChange(val === '' ? null : val);
                                }}
                                data-test-id="plain-text-input"
                            />
                        )
                }

                {
                    HelperComponent != null && !showValueOnly && (
                        <HelperComponent
                            onChange={(val) => this.props.onChange(val)}
                            readOnly={readOnly}
                        />
                    )
                }
            </Container>
        );
    }
}

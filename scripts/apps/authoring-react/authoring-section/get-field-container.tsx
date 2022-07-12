/* eslint-disable react/no-multi-comp */
import React from 'react';
import {IAuthoringFieldV2, IEditorComponentContainerProps} from 'superdesk-api';
import {Switch} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {Spacer} from 'core/ui/components/Spacer';

export function getFieldContainer(
    useHeaderLayout: boolean,
    canBeToggled: boolean,
    field: IAuthoringFieldV2,
    toggledOn: boolean,
    toggleField: (fieldId: string) => void,
) {
    const toggle = canBeToggled && (
        <Switch
            label={gettext('Toggle field')}
            value={toggledOn}
            onChange={() => {
                toggleField(field.id);
            }}
        />
    );

    class HeaderLayout extends React.PureComponent<IEditorComponentContainerProps> {
        render() {
            const {miniToolbar} = this.props;

            return (
                <div>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'start',
                            alignItems: 'center',
                        }}
                    >
                        <span className="form-label">
                            <Spacer h gap="8" noGrow>
                                <span>{field.name}</span>
                                <span>{toggle}</span>
                            </Spacer>
                        </span>

                        <div style={{flexGrow: 1}}>
                            {this.props.children}

                            {
                                miniToolbar != null && (
                                    <div>{miniToolbar}</div>
                                )
                            }
                        </div>
                    </div>
                </div>
            );
        }
    }

    class ContentLayout extends React.PureComponent<IEditorComponentContainerProps> {
        render() {
            const {miniToolbar} = this.props;

            return (
                <div>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 15,
                        }}
                    >
                        <Spacer h gap="8" noGrow>
                            <span className="field-label--base">
                                {field.name}
                            </span>

                            <span>{toggle}</span>
                        </Spacer>

                        {
                            miniToolbar != null && (
                                <div>{miniToolbar}</div>
                            )
                        }
                    </div>

                    {this.props.children}
                </div>
            );
        }
    }

    const Container = useHeaderLayout ? HeaderLayout : ContentLayout;

    return Container;
}

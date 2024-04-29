/* eslint-disable react/no-multi-comp */
import React from 'react';
import classNames from 'classnames';
import {IAuthoringFieldV2, IEditorComponentContainerProps} from 'superdesk-api';
import {Switch} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {Spacer, SpacerBlock} from 'core/ui/components/Spacer';

export function getFieldContainer(
    useHeaderLayout: boolean,
    canBeToggled: boolean,
    field: IAuthoringFieldV2,
    toggledOn: boolean,
    toggleField: (fieldId: string) => void,
    validationError?: string,
) {
    const toggle = canBeToggled && (
        <Switch
            label={{content: gettext('Toggle field')}}
            value={toggledOn}
            onChange={() => {
                toggleField(field.id);
            }}
        />
    );

    class HeaderLayout extends React.PureComponent<IEditorComponentContainerProps> {
        render() {
            const {miniToolbar, sectionClassNames} = this.props;

            return (
                <div className={sectionClassNames?.header}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'start',
                            alignItems: 'center',
                        }}
                    >
                        <span
                            className={classNames(
                                'form-label',
                                {'form-label--invalid': validationError != null},
                            )}
                            style={{
                                width: '90px',
                                justifyContent: 'end',
                            }}
                        >
                            <Spacer h gap="8" noGrow noWrap>
                                <span style={{textAlign: 'end'}}>
                                    {field.fieldConfig.required && (
                                        <span
                                            className="sd-font-size--x-small"
                                            style={{color: 'var(--sd-colour-alert)'}}
                                        >* </span>
                                    )}
                                    {field.name}
                                </span>
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

                            {
                                validationError != null && (
                                    <div>
                                        <SpacerBlock v gap="4" />
                                        <div className="input-field-error">{validationError}</div>
                                    </div>
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
            const {miniToolbar, sectionClassNames} = this.props;

            return (
                <div className={sectionClassNames?.content}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <Spacer h gap="8" noGrow>
                            <span
                                className={classNames(
                                    'field-label--base',
                                    {'field-label--base--invalid': validationError != null},
                                )}
                            >
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

                    <SpacerBlock v gap="8" />

                    {
                        validationError != null && (
                            <div className="input-field-error">{validationError}</div>
                        )
                    }

                    <SpacerBlock v gap="8" />

                    {this.props.children}
                </div>
            );
        }
    }

    const Container = useHeaderLayout ? HeaderLayout : ContentLayout;

    return Container;
}

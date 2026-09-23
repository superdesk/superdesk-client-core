/* eslint-disable react/no-multi-comp */
import React from 'react';
import classNames from 'classnames';
import {IAuthoringFieldV2, IEditorComponentContainerProps, IPropsAuthoringFieldTemplate} from 'superdesk-api';
import {Switch} from 'superdesk-ui-framework/react';
import {gettext} from 'core/utils';
import {Spacer, SpacerBlock} from 'core/ui/components/Spacer';

export const RequiredIndicatorForHeader = () => (
    <span
        className="sd-font-size--x-small"
        style={{color: 'var(--sd-colour-alert)'}}
    >
        *
    </span>
);

export const RequiredIndicatorForContent = () => (
    <span
        style={{
            fontSize: 'var(--text-size--base)',
            fontStyle: 'italic',
        }}
    >
        {gettext('Required')}
    </span>
);

export interface IGetFieldContainerOptions {
    useHeaderLayout: boolean,
    canBeToggled: boolean,
    field: IAuthoringFieldV2,
    toggledOn: boolean,
    toggleField: (fieldId: string) => void,
    validationError?: string,
    fieldTemplate: React.ComponentType<IPropsAuthoringFieldTemplate> | null;
}

export function getFieldContainer(options: IGetFieldContainerOptions) {
    const {
        useHeaderLayout,
        canBeToggled,
        field,
        toggledOn,
        toggleField,
        validationError,
    } = options;

    const FieldTemplate = options.fieldTemplate;

    if (FieldTemplate != null) {
        class Component extends React.PureComponent<IEditorComponentContainerProps> {
            render() {
                return (
                    <FieldTemplate
                        field={field}
                        input={this.props.children}
                        validationError={validationError}
                        miniToolbar={this.props.miniToolbar}
                    />
                );
            }
        }

        return Component;
    }

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
            const {miniToolbar} = this.props;

            return (
                <div className="authoring-header-field">
                    <span
                        data-test-id="authoring-field-label"
                        className={classNames(
                            'authoring-header__item-label',
                            {'form-label--invalid': validationError != null},
                        )}
                    >
                        {field.name}
                        {field.fieldConfig.required && (
                            <RequiredIndicatorForHeader />
                        )}
                    </span>

                    {/* the label column is a fixed width, so the toggle goes beside it, not in it */}
                    {canBeToggled && (
                        <div className="authoring-header-field__toggle">{toggle}</div>
                    )}

                    {/*
                        `sd-input-style` is what authoring-angular puts on this holder for a header
                        field (`getTemplateForHeader` in core/editor3/directive.tsx). It is the only
                        thing that makes an editor3 field in the header look like a boxed input:
                        `.sd-input-style .Editor3-root` (core/editor3/styles.scss) replaces
                        `.Editor3-root`'s four-sided border with a single bottom one, so the accent
                        colour `.Editor3-root:not(.read-only):focus-within` sets on focus lands as
                        an underline rather than a frame.
                    */}
                    <div
                        className="authoring-header__input-holder sd-input-style"
                        data-test-id="authoring-field-input"
                    >
                        {this.props.children}

                        <Spacer h gap="8" justifyContent="end" noGrow noWrap>
                            {
                                validationError != null && (
                                    <div className="input-field-error">{validationError}</div>
                                )
                            }

                            {
                                miniToolbar != null && (
                                    <div>{miniToolbar}</div>
                                )
                            }
                        </Spacer>
                    </div>
                </div>
            );
        }
    }

    class ContentLayout extends React.PureComponent<IEditorComponentContainerProps> {
        render() {
            const {miniToolbar} = this.props;

            return (
                <div className="authoring-section__field">
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <Spacer h gap="8" noGrow>
                            <Spacer h gap="8" noGrow noWrap>
                                <span
                                    data-test-id="authoring-field-label"
                                    className={classNames(
                                        'field-label--base',
                                        {'field-label--base--invalid': validationError != null},
                                    )}
                                >
                                    {field.name}
                                </span>

                                {field.fieldConfig.required && (
                                    <RequiredIndicatorForContent />
                                )}
                            </Spacer>

                            <span>{toggle}</span>
                        </Spacer>

                        {
                            miniToolbar != null && (
                                <div>{miniToolbar}</div>
                            )
                        }
                    </div>

                    <SpacerBlock v gap="4" />

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

import * as React from 'react';
import {pick, range} from 'lodash';
import {omit} from '@sourcefabric/common';
import {
    Button,
    Modal,
    RadioButtonGroup,
    Spacer,
} from 'superdesk-ui-framework/react';
import {availabilityStatuses, TAGS_VOCABULARY_ID} from '../constants';
import {IAvailabilityRecord, IAvailabilityRecordTemplate, ITagsWhiteList} from '../interfaces';
import {superdesk} from '../superdesk';
import {
    fullWidthNoGrow,
    getAvailabilityRecordBaseFields,
    getFilteredTags,
    getLabelForStatus,
    getLocalizedDateString,
    validateAvailabilityRecord,
} from '../utils';
import {WithWorkingHoursEditor, workingHoursEditorColumnCount} from './edit-working-hours';
import {ValidationErrors} from '../validation-errors';
import {WorkingHoursGridLabels} from './working-hours-grid-labels';
import {IUser} from 'superdesk-api';

const {gettext, locale} = superdesk.localization;
const {httpRequestJsonLocal} = superdesk;
const {assertNever} = superdesk.helpers;
const {VocabularySelect} = superdesk.components;

interface IProps {
    user: IUser;

    workingDay:
        {kind: 'saved'; value: IAvailabilityRecord}
        | {kind: 'draft'; template: IAvailabilityRecordTemplate};

    /**
     * item is returned so parent component can conditionally show preview after closing
     */
    onClose(item: IAvailabilityRecord | null): void;

    tagsWhitelist: ITagsWhiteList;
}

interface IState {
    workingDay: IAvailabilityRecord;
    savingInProgress: boolean;
    validationError: string | null;
}

export class EditWorkdayModal extends React.PureComponent<IProps, IState> {
    private _mounted: boolean;
    private errorsElementRef: React.RefObject<HTMLDivElement>;

    constructor(props: IProps) {
        super(props);

        this.state = {
            workingDay: (() => {
                if (this.props.workingDay.kind === 'saved') {
                    return this.props.workingDay.value;
                } else if (this.props.workingDay.kind === 'draft') {
                    return this.props.workingDay.template as IAvailabilityRecord;
                } else {
                    return assertNever(this.props.workingDay);
                }
            })(),
            savingInProgress: false,
            validationError: null,
        };

        this._mounted = false;
        this.errorsElementRef = React.createRef<HTMLDivElement>();
    }


    private save() {
        const {workingDay} = this.state;

        const validationError: string | null = workingDay.status !== 'partial' ? null : validateAvailabilityRecord(
            workingDay,
            locale.code,
        );

        if (validationError != null) {
            this.setState({validationError}, () => {
                this.errorsElementRef.current?.scrollIntoView();
            });

            return;
        }

        this.setState({savingInProgress: true});

        // drop working hours if working day is not partial
        const workingDayNext: IAvailabilityRecord = workingDay;

        const savePromise = (() => {
            if (this.props.workingDay.kind === 'saved') {
                return httpRequestJsonLocal<IAvailabilityRecord>({
                    method: 'PATCH',
                    path: `/user_availability/${workingDay._id}`,
                    payload: pick(workingDayNext, getAvailabilityRecordBaseFields(workingDayNext.status)),
                    headers: {
                        'If-Match': workingDay._etag,
                    },
                });
            } else if (this.props.workingDay.kind === 'draft') {
                return httpRequestJsonLocal<IAvailabilityRecord>({
                    method: 'POST',
                    path: '/user_availability',
                    payload: {
                        ...workingDayNext,
                        user: this.props.user._id,
                    },
                });
            } else {
                return assertNever(this.props.workingDay);
            }
        })();

        savePromise.then((res) => {
            this.handleClose(res);
        }).finally(() => {
            if (this._mounted) {
                this.setState({savingInProgress: false});
            }
        });
    }

    componentDidMount(): void {
        this._mounted = true;
    }

    componentWillUnmount(): void {
        this._mounted = false;
    }

    handleClose(item?: IAvailabilityRecord) {
        const itemFallback = (() => {
            if (this.props.workingDay.kind === 'draft') {
                return null;
            } else if (this.props.workingDay.kind === 'saved') {
                return this.props.workingDay.value;
            } else {
                return assertNever(this.props.workingDay);
            }
        })() satisfies IAvailabilityRecord | null;

        this.props.onClose(item ?? itemFallback);
    }

    render() {
        const {workingDay} = this.state;
        const tagsVocabulary = superdesk.entities.vocabulary.getAll().get(TAGS_VOCABULARY_ID);

        return (
            <Modal
                visible
                headerTemplate={gettext('Edit availability')}
                footerTemplate={(
                    <Spacer h gap="8" justifyContent="end" noWrap>
                        <Button
                            text={gettext('Cancel')}
                            onClick={() => this.handleClose()}
                            noMargin
                            disabled={this.state.savingInProgress}
                        />

                        <Button
                            text={gettext('Save')}
                            type="primary"
                            onClick={() => this.save()}
                            disabled={this.state.savingInProgress}
                            isLoading={this.state.savingInProgress}
                            noMargin
                        />
                    </Spacer>
                )}
                onHide={() => this.handleClose()}
                data-test-id="edit-workday"
            >
                <Spacer v gap="16" noWrap>
                    <h4>
                        {getLocalizedDateString(locale.code, new Date(workingDay.date))}
                    </h4>

                    <RadioButtonGroup
                        value={workingDay.status}
                        options={availabilityStatuses.map((status) => ({
                            value: status,
                            label: getLabelForStatus(status),
                        }))}
                        onChange={(nextStatus: IAvailabilityRecord['status']) => {
                            this.setState({
                                workingDay: (() => {
                                    if (nextStatus === 'partial') {
                                        return {
                                            ...omit(workingDay, 'status', 'date', 'working_hours'),
                                            status: 'partial',
                                            date: workingDay.date,
                                            working_hours: [],
                                        } satisfies IAvailabilityRecord;
                                    } else {
                                        return {
                                            ...omit(workingDay, 'status', 'date', 'working_hours'),
                                            status: nextStatus,
                                            date: workingDay.date,
                                            working_hours: [{tags: []}],
                                        } satisfies IAvailabilityRecord;
                                    }
                                })(),
                            });
                        }}
                        disabled={this.state.savingInProgress}
                        data-test-id="status"
                    />

                    {
                        workingDay.status === 'partial'
                            ? (
                                <div
                                    style={{
                                        display: 'grid',
                                        gap: 'var(--gap-1)',
                                        gridTemplateColumns: range(0, workingHoursEditorColumnCount)
                                            .map(() => 'auto')
                                            .join(' '),
                                    }}
                                >
                                    <WorkingHoursGridLabels />

                                    <WithWorkingHoursEditor
                                        value={workingDay.working_hours ?? []}
                                        onChange={(nextValue) => {
                                            this.setState({
                                                validationError: null,
                                                workingDay: {
                                                    ...workingDay,
                                                    working_hours: nextValue,
                                                },
                                            });
                                        }}
                                        disabled={this.state.savingInProgress}
                                        tagsWhitelist={this.props.tagsWhitelist}
                                    />
                                </div>
                            ) : (() => {
                                const value: Array<string> =
                                    ((workingDay.working_hours ?? [])?.[0]?.tags ?? []).map((item) => item.code);

                                return (
                                    <div style={fullWidthNoGrow}>
                                        <VocabularySelect
                                            label={{text: tagsVocabulary.display_name}}
                                            value={value}
                                            getOptions={() => getFilteredTags(
                                                new Set<string>(value),
                                                this.props.tagsWhitelist,
                                            )}
                                            onChange={(qcodes) => {
                                                this.setState({
                                                    validationError: null,
                                                    workingDay: {
                                                        ...workingDay,
                                                        working_hours: [
                                                            {
                                                                tags: qcodes.map((qcode) => ({code: qcode})),
                                                            },
                                                        ],
                                                    },
                                                });
                                            }}
                                            multiple={true}
                                            fullWidth={true}
                                            disabled={this.state.savingInProgress}
                                            selectBranchWithChildren
                                            data-test-id="tags"
                                        />
                                    </div>
                                );
                            })()
                    }

                    {
                        this.state.validationError != null && (
                            <ValidationErrors scrollRef={this.errorsElementRef}>
                                {this.state.validationError}
                            </ValidationErrors>
                        )
                    }
                </Spacer>
            </Modal>
        );
    }
}

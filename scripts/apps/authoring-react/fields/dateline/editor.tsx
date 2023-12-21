import React from 'react';
import ng from 'core/services/ng';
import {DatePickerISO} from 'superdesk-ui-framework/react';
import {
    ICommonFieldConfig,
    IDatelineUserPreferences,
    IDatelineValueOperational,
    IEditorComponentProps,
} from 'superdesk-api';
import {dateToServerString} from 'core/get-superdesk-api-implementation';
import {getLocaleForDatePicker} from 'core/helpers/ui-framework';
import {MultiSelectTreeWithTemplate} from 'core/ui/components/MultiSelectTreeWithTemplate';
import {Spacer} from 'core/ui/components/Spacer';
import {appConfig} from 'appConfig';
import {gettext} from 'core/utils';

type IProps = IEditorComponentProps<
    IDatelineValueOperational,
    ICommonFieldConfig,
    IDatelineUserPreferences
>;

type ICancelFn = () => void;

function searchOptions(
    term: string,
    callback: (res: any) => void,
): ICancelFn {
    const abortController = new AbortController();

    ng.get('places').searchDateline(term, 'en', abortController.signal).then((res) => {
        callback({
            nodes: res.slice(0, 10).map((item) => ({value: item})),
            lookup: {},
        });
    });

    return () => abortController.abort();
}

export class Editor extends React.PureComponent<IProps> {
    render() {
        const Container = this.props.container;

        return (
            <Container>
                <Spacer h gap="8" justifyContent="space-between" alignItems="center">
                    <MultiSelectTreeWithTemplate
                        allowMultiple={false}
                        kind="asynchronous"
                        searchOptions={(term, callback) => searchOptions(term, callback)}
                        values={[this.props.value?.located]}
                        onChange={([value]) => {
                            this.props.onChange({
                                ...this.props.value,
                                located: value,
                            });
                        }}
                        optionTemplate={
                            ({item}) => item != null ? (
                                <span>
                                    {item?.city}<br />
                                    <b>{item?.state}, {item?.country}</b>
                                </span>
                            ) : null
                        }
                        valueTemplate={
                            ({item}) => item != null ? (
                                <span>
                                    {item?.city}
                                </span>
                            ) : null
                        }
                        getId={(option) => option?.city_code}
                        getLabel={(item) => item?.city}
                    />

                    <DatePickerISO
                        label=""
                        labelHidden
                        inlineLabel
                        value={this.props.value?.date}
                        onChange={(dateString) => {
                            this.props.onChange({
                                ...this.props.value,
                                date: dateToServerString(new Date(dateString)),
                            });
                        }}
                        dateFormat={appConfig.view.dateformat}
                        locale={getLocaleForDatePicker(this.props.language)}
                        disabled={this.props.value?.located?.city == null}
                    />
                </Spacer>
            </Container>
        );
    }
}

import {gettext} from 'core/utils';
import {IStage} from 'superdesk-api';
import {dataApi} from 'core/helpers/CrudManager';
import {getSelectSingleValueAutoComplete} from './select_single_value_autocomplete';

export const StageSingleValue = getSelectSingleValueAutoComplete(
    (searchString: string, props) => {
        const deskId = props.formValues[props.formField.component_parameters['deskField']];
        const deskFilter = {desk: deskId};

        if (deskId == null) {
            return Promise.resolve(null);
        } else {
            return dataApi.query<IStage>(
                'stages',
                1,
                {field: 'name', direction: 'ascending'},
                (
                    searchString.length > 0
                        ? {
                            $and: [
                                {...deskFilter},
                                {
                                    name: {
                                        $regex: searchString,
                                        $options: '-i',
                                    },
                                },
                            ],
                        }
                        : deskFilter
                ),
                50,
            );
        }
    },
    (id) => dataApi.findOne<IStage>('stages', id),
    (props) => {
        const deskId = props.formValues[props.formField.component_parameters['deskField']];

        if (deskId == null ) {
            return gettext('Select a desk first');
        } else {
            return '';
        }
    },
    (item: IStage) => item.name,
    (props) => [props.formField.component_parameters['deskField']],
);

import {gettext} from 'core/utils';
import {IStage} from 'superdesk-api';
import {dataApi} from 'core/helpers/CrudManager';
import {getSelectSingleValueAutoComplete} from './select_single_value_autocomplete';

export const StageSingleValue = getSelectSingleValueAutoComplete({
    query: (searchString: string, props) => {
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
                                        $options: 'i',
                                    },
                                },
                            ],
                        }
                        : deskFilter
                ),
                200,
            );
        }
    },
    queryById: (id) => dataApi.findOne<IStage>('stages', id),
    getPlaceholder: (props) => {
        const deskId = props.formValues[props.formField.component_parameters['deskField']];

        if (deskId == null) {
            return gettext('Select a desk first');
        } else {
            return '';
        }
    },
    getLabel: (item: IStage) => item.name,
    getDisabled: (props) => {
        const deskId = props.formValues[props.formField.component_parameters['deskField']];

        return deskId == null;
    },
    getDependentFields: (props) => [props.formField.component_parameters['deskField']],
});

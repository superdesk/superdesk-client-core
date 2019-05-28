import ng from 'core/services/ng';
import {gettext} from 'core/utils';
import {getSelectSingleValue} from './select_single_value';
import {IStage} from 'superdesk-interfaces/Stage';
import {IRestApiResponse} from 'superdesk-api';

export const StageSingleValue = getSelectSingleValue(
    (props) =>
        ng.getService('api')
            .then((api) => {
                const deskId = props.formValues[props.formField.component_parameters['deskField']];

                if (deskId == null) {
                    return Promise.resolve(null);
                } else {
                    return api('stages').query({
                        where: {desk: deskId},
                        max_results: 200,
                    })
                        .then(
                            (stages: IRestApiResponse<IStage>) =>
                                stages._items.map(({_id, name}) => ({id: _id, label: name})),
                        );
                }
            }),
    gettext('Select a desk first'),
    (props) => [props.formField.component_parameters['deskField']],
);

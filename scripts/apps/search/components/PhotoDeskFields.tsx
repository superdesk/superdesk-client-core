import React from 'react';
import PropTypes from 'prop-types';
import * as fields from '../components/fields';
import {getLabelNameResolver} from 'apps/workspace/helpers/getLabelForFieldId';
import {connectPromiseResults} from 'core/helpers/ReactRenderAsync';

const availablelabelModes = ['always', 'never', 'never-with-custom-renderer'];

export const PhotoDeskFieldsComponent:React.StatelessComponent<any> = (props) => {
    const {item, getLabelForFieldId, itemClassName} = props;

    return props.fieldsConfig
        .map((fieldId, i) => {
            const customRenderedAvailable = typeof fields[fieldId] === 'function';
            const value = customRenderedAvailable
                ? fields[fieldId]({item: item, svc: props.svc, className: itemClassName})
                : item[fieldId];

            if (value == null) {
                return null;
            }

            const showLabel =
                props.labelMode === 'always'
                || !(props.labelMode === 'never-with-custom-renderer' && customRenderedAvailable);

            return showLabel === true
                ? (
                    <span key={i} className={itemClassName}>
                        <span className="sd-grid-item__text-label">
                            {getLabelForFieldId(fieldId)}:
                        </span>
                        <span className="sd-grid-item__text-strong">{value}</span>
                    </span>
                )
                : <span className="sd-grid-item__footer-block-item" key={i}>{value}</span>;
        });
};

export const PhotoDeskFields:React.StatelessComponent<any> = connectPromiseResults(() => ({
    getLabelForFieldId: getLabelNameResolver(),
}))(PhotoDeskFieldsComponent);

PhotoDeskFieldsComponent.propTypes = {
    svc: PropTypes.object.isRequired,
    item: PropTypes.any,
    getLabelForFieldId: PropTypes.func.isRequired,
    fieldsConfig: PropTypes.array,
    labelMode: PropTypes.oneOf(availablelabelModes),
    itemClassName: PropTypes.string,
};
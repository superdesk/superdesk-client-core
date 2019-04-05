import React from 'react';
import * as fields from '../components/fields';
import {getLabelNameResolver} from 'apps/workspace/helpers/getLabelForFieldId';
import {connectPromiseResults} from 'core/helpers/ReactRenderAsync';

interface IProps {
    svc: any;
    item: any;
    fieldsConfig: any;
    labelMode?: 'always' | 'never' | 'never-with-custom-renderer';
    itemClassName: string;

    // connected
    getLabelForFieldId?: any;
}

export const PhotoDeskFieldsComponent: React.StatelessComponent<IProps> = (props) => {
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

export const PhotoDeskFields = connectPromiseResults<IProps>(() => ({
    getLabelForFieldId: getLabelNameResolver(),
}))(PhotoDeskFieldsComponent);

import React from 'react';
import {fields} from '../components/fields';
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
            const Component = fields[fieldId];
            const value = Component != null
                ? <Component item={item} svc={props.svc} />
                : item[fieldId];

            if (value == null) {
                return null;
            }

            const showLabel =
                props.labelMode === 'always'
                || !(props.labelMode === 'never-with-custom-renderer' && Component != null);

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

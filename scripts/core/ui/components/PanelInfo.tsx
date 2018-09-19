import React from 'react';
import PropTypes from 'prop-types';

/**
 * @ngdoc react
 * @name PanelInfo
 * @description Information displayed in the middle of a panel
 */
const PanelInfo: React.StatelessComponent<any> = ({heading, description}) => (
    <div className="panel-info">
        <div className="panel-info__icon">
            <i className="big-icon--comments" />
        </div>
        {heading &&
            <h3 className="panel-info__heading">{heading}</h3>
        }
        {description &&
            <p className="panel-info__description">{description}</p>
        }
    </div>
);

PanelInfo.propTypes = {
    heading: PropTypes.string,
    description: PropTypes.string,
};

export default PanelInfo;

/* eslint-disable quotes, comma-dangle */
/* tslint:disable: trailing-comma */

export const getInstanceConfigSchema = (gettext) => ({
    "$schema": "http://json-schema.org/draft-07/schema#",
    "properties": {
        "authoring": {
            "properties": {
                "customToolbar": {
                    "type": "boolean"
                },
                "editor": {
                    "properties": {
                        "version": {
                            "enum": [
                                "2",
                                "3"
                            ],
                            "type": "string"
                        }
                    },
                    "type": "object",
                    "translations": {
                        "version": gettext('version')
                    }
                }
            },
            "type": "object",
            "translations": {
                "customToolbar": gettext('customToolbar'),
                "editor": gettext('editor')
            }
        },
        "monitoring": {
            "properties": {
                "stageCount": {
                    "items": {
                        "type": "string"
                    },
                    "type": "array"
                }
            },
            "type": "object",
            "translations": {
                "stageCount": gettext('stageCount')
            }
        }
    },
    "type": "object",
    "translations": {
        "authoring": gettext('authoring'),
        "monitoring": gettext('monitoring')
    }
});

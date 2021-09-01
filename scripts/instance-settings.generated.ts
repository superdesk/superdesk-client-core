/* eslint-disable quotes, comma-dangle */
/* tslint:disable: trailing-comma max-line-length */

export const getInstanceConfigSchema = (gettext) => ({
    "$schema": "http://json-schema.org/draft-07/schema#",
    "properties": {
        "users": {
            "properties": {
                "minutesOnline": {
                    "description": gettext('Time of inactivity in minutes until user is no longer considered online.'),
                    "type": "number"
                }
            },
            "required": [
                "minutesOnline"
            ],
            "type": "object",
            "translations": {
                "minutesOnline": gettext('minutes online')
            }
        }
    },
    "required": [
        "users"
    ],
    "type": "object",
    "translations": {
        "users": gettext('users')
    }
});

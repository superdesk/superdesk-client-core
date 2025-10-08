# Brief feature description

To plan coverage, newsroom managers need to know correspondent availability.

This feature allows correspondents to enter their availability in user profile and then there's a dedicated view for
newsroom managers to see combined availability calendar of all correspondents by day or week.

Correspondents can set availability as available all day, unavailable all day or partially available for certain time ranges.

# Terminology

The feature is composed of 2 major parts - settings and dashboard.

Settings part is available to all users where they can set their individual availability.

Dashboard is where admins or other users with a privilege can see availability of all users.

# Technical details on filtering

As mentioned above there are 3 availability statuses - available, unavailable and partially available. It is also possible
that a correspondent has set neither. He might not know yet whether he'd be available.

We only store a database record for known availability - which makes filtering a bit more tricky since we do want to
allow showing which correspondents haven't set availability, but API doesn't return records if availability is not set
thus on client side we have to assume missing records mean that availability is not set.

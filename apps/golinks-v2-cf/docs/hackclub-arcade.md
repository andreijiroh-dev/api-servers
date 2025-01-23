# Documentation for Hack Hour / Arcade Reviewers

## Local Development

[See the README](../README.md#development) for instructions on how to locally run the golinks server.

## Testing the staging deployment

The API production environment at <https://go.andreijiroh.xyz> is currently reserved for personal use,
so it is preferred to

1. Go to <https://golinks-next-staging.ajhalili2006.workers.dev/api/docs> to access the Swagger UI.
2. Select the `Staging Deployment` from the list of servers.

![](https://files.slack.com/files-pri/T0266FRGM-F07CEURPSGP/image.png?pub_secret=2faa123191)

3. Now you can test the API. For routes that require authenication, use the following
   API key for the `X-Golinks-Admin-Key` header.

```
gostg_hackclub-7yIz7ZgIy7eS9LI2KId1WxdgBisVXTKGBvuLBroIXVBqS9U9
```

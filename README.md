# Apollo Schema Check Action

[![Build status](https://github.com/iansu/apollo-schema-check-action/workflows/CI/badge.svg)](https://github.com/iansu/apollo-schema-check-action/actions)
[![codecov](https://codecov.io/gh/iansu/apollo-schema-check-action/branch/master/graph/badge.svg)](https://codecov.io/gh/iansu/apollo-schema-check-action)

A GitHub Action to run a schema check using the [Apollo CLI](https://www.apollographql.com/docs/devtools/cli/) and [Apollo Studio](https://www.apollographql.com/docs/studio/) (formerly Graph Manager) and post the results as a comment on a Pull Request

## Usage

Create a file in your repo named `.github/workflows/schema-check.yml` with the following contents:

```yml
name: Schema Check

on:
  pull_request:
    types: [opened, reopened, synchronize]

jobs:
  check_schema:
    name: check schema
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v2
      - name: Customer API check
        uses: iansu/apollo-schema-check-action@v2
        with:
          title: Customer API
          graph: my-customer-api
          variant: production
          localSchemaFile: 'schema.graphql'
          serviceName: my-service
          validationPeriod: P2W
          key: ${{ secrets.APOLLO_KEY }}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

When you create a new PR that includes schema changes the results of the schema check will be posted as a comment. Here's an example of what that looks like:

![Screenshot](./screenshot.png)

Note that you won't see a comment if your PR doesn't include any schema changes. You can change this behaviour by setting `alwaysComment: true`.

## Settings

If you provide the path to an [Apollo config file](https://www.apollographql.com/docs/devtools/apollo-config/) in your project any applicable settings from there will be used. If a setting is specified in the Apollo config file and in the workflow settings, the workflow setting will take precedence.

You must provide either an `endpoint` to introspect your schema or the path to one or more `localSchemaFile`s.

| Name                          | Description                                                                                                                                                                                                                                   | Default | Required |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | -------- |
| alwaysComment                 | Leave a comment on the PR even if there are no schema changes in the PR                                                                                                                                                                       | false   | No       |
| config                        | Path to your Apollo config file                                                                                                                                                                                                               |         | No       |
| endpoint                      | The URL for the CLI to use to introspect your service                                                                                                                                                                                         |         | No       |
| failOnError                   | Fail the check if breaking changes or composition errors are found                                                                                                                                                                            | true    | No       |
| graph                         | The ID of the graph in Apollo Graph Manager to check your proposed schema changes against                                                                                                                                                     |         | No       |
| headers                       | Additional headers to send to server for introspectionQuery. Multiple headers can be provided as a comma separated list. NOTE: The `endpoint` input is REQUIRED if using the `headers` input.                                                 |         | No       |
| key                           | The API key to use for authentication to Apollo Graph Manager                                                                                                                                                                                 |         | Yes      |
| localSchemaFile               | Path to one or more local GraphQL SDL file(s). Supports comma-separated list of paths (ex. `schema.graphql,extensions.graphql`)                                                                                                               |         | No       |
| queryCountThreshold           | Minimum number of requests within the requested time window for a query to be considered                                                                                                                                                      |         | No       |
| queryCountThresholdPercentage | Number of requests within the requested time window for a query to be considered, relative to total request count. Expected values are between 0 and 0.05 (minimum 5% of total request volume)                                                |         | No       |
| serviceName                   | Provides the name of the implementing service for a federated graph. This flag will indicate that the schema is a partial schema from a federated service                                                                                     |         | No       |
| title                         | The name of the graph which will be shown in the comment                                                                                                                                                                                      |         | No       |
| validationPeriod              | The size of the time window with which to validate the schema against. You may provide a number (in seconds), or an ISO8601 format duration for more granularity (see: [ISO 8601 Durations](https://en.wikipedia.org/wiki/ISO_8601#Durations) |         | Yes      |
| variant                       | The variant to check the proposed schema against                                                                                                                                                                                              |         | No       |

## Why use this instead of the Apollo GitHub App

This Action offers some features that the Apollo GitHub App doesn't. If you don't need these features then you should consider using it instead. The main differences are:

1. You don't have to install an app in your org or repo to use this Action
1. This Action posts a comment with the results directly on your PR
1. This Action supports multiple graphs

## Credits

Made with :tumbler_glass: by [Ian Sutherland](https://iansutherland.ca) ([@iansu](https://twitter.com/iansu)). This project is released under the [MIT](/LICENSE) license.

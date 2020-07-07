# Apollo Schema Check Action

[![Build status](https://github.com/iansu/apollo-schema-check-action/workflows/CI/badge.svg)](https://github.com/iansu/apollo-schema-check-action/actions)

A GitHub Action to run a schema check using the [Apollo CLI](https://www.apollographql.com/docs/devtools/cli/) and [Apollo Studio](https://www.apollographql.com/docs/studio/) (formerly Graph Manager) and post the results as a comment on a Pull Request

## Usage

Create a file in your repo named `.github/workflows/schema_check.yml` with the following contents:

```yml
name: Schema Check

on:
  pull_request:
    types: ['opened', 'reopened', 'synchronize']

jobs:
  title:
    name: check schema
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Check schema
        uses: iansu/apollo-schema-check-action@v1
        with:
          config: apollo.config.js
          token: ${{ secrets.GITHUB_TOKEN }}
```

## Settings

Almost all of the settings from the [Apollo CLI `schema:check` command](https://github.com/apollographql/apollo-tooling/tree/master/packages/apollo#apollo-servicecheck) are supported, with the following differences:

1. The `json` and `markdown` options have been removed because this action requires markdown to post a comment on your PR
1. The `header` option works slightly different, you pass it a comma separated list of headers. For example: `Header1=Value,Header2=Value2`.
1. The `token` parameter has been added and is how you pass in your GitHub token. This setting is **required** in order to post a comment on your PR.

## Credits

Made with :tumbler_glass: by [Ian Sutherland](https://iansutherland.ca) ([@iansu](https://twitter.com/iansu)). This project is released under the [MIT](/LICENSE) license.

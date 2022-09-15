# Apollo Schema Check Action Changelog

## 2.0.2 (September 15, 2022)

- Update `from` parameter format. It seems Apollo no longer wants `sec` included with offsets.

## 2.0.1 (July 6, 2022)

- Pass `from` parameter to Apollo Studio API as a string instead of a number (see: [https://status.apollographql.com/incidents/c5dvk0tbg5bv](https://status.apollographql.com/incidents/c5dvk0tbg5bv))

## 2.0.0 (December 20, 2021)

- Rewrite to use a direct call to the Apollo Studio API instead of using the Apollo CLI

## 1.2.2 (December 2, 2021)

- Add additional debug logging
- Use the `apolloVersion` argument that was previously added but not used in the code

## 1.2.1 (December 2, 2021)

- Improve output for debugging

## 1.2.0 (August 18, 2021)

- Add branch and author information when pushing to Apollo Studio

## 1.1.0 (August 18, 2021)

- Add `apolloVersion` setting to specify Apollo CLI version
- Update Apollo CLI to 2.33.6 (latest)
- Update dependencies

## 1.0.0 (July 6, 2020)

Initial release! :tada:

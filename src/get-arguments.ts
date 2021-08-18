import { getInput } from '@actions/core';

import { debug } from './actions';

const getArguments = (): string[] => {
  const inputs = {
    config: getInput('config'),
    graph: getInput('graph'),
    variant: getInput('variant'),
    endpoint: getInput('endpoint'),
    header: getInput('header'),
    key: getInput('key'),
    localSchemaFile: getInput('localSchemaFile'),
    queryCountThreshold: getInput('queryCountThreshold'),
    queryCountThresholdPercentage: getInput('queryCountThresholdPercentage'),
    serviceName: getInput('serviceName'),
    validationPeriod: getInput('validationPeriod')
  };
  // see https://www.apollographql.com/docs/studio/github-integration/#github-actions
  const branch = `--branch=${process.env.GITHUB_REF}#refs/heads/`;
  const author = `--author=${process.env.GITHUB_ACTOR}`;
  const args = [branch, author];

  debug('token', !!process.env.GITHUB_TOKEN);

  if (inputs.graph && !inputs.key) {
    throw new Error('You must provide an Apollo key');
  }

  if (!inputs.config && !inputs.graph) {
    throw new Error('You must provide either a config file or a graph name');
  }

  for (const [key, value] of Object.entries(inputs)) {
    if (key === 'header' && value) {
      const headers = value.split(',');

      for (const header of headers) {
        args.push(`--header='${header.trim()}'`);
      }
    } else if (value) {
      args.push(`--${key}=${value}`);
    }
  }

  args.push('--markdown');

  return args;
};

export { getArguments };

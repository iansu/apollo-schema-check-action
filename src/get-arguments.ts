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
  const args = [];

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

  debug('Apollo CLI argument string', args.join(' '));

  return args;
};

export { getArguments };

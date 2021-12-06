import { readFile } from 'fs/promises';
import { parse, toSeconds } from 'iso8601-duration';
import { getInput } from '@actions/core';
import { Octokit } from '@octokit/action';
import { context } from '@actions/github';

import { debug } from './actions';
import { getSchema } from './get-schema';

export interface ActionInputs {
  config?: string;
  graph?: string;
  variant?: string;
  endpoint?: string;
  headers?: string;
  apolloKey: string;
  localSchemaFile?: string;
  queryCountThreshold?: string;
  queryCountThresholdPercentage?: string;
  serviceName?: string;
  validationPeriod: string;
}

export interface ApolloConfigFile {
  graphId?: string;
  variant?: string;
  service?: {
    name?: string;
    endpoint?: {
      url: string;
      headers?: { [key: string]: string };
      skipSSLValidation?: boolean;
    };
    localSchemaFile?: string | string[];
  };
}

export interface MergedConfig {
  graph?: string;
  variant: string;
  serviceName?: string;
  proposedSchema: {
    sdl: string;
  };
  queryParameters: {
    from: number;
    queryCountThreshold?: number;
    queryCountThresholdPercentage?: number;
  };
}

export interface CommitDetails {
  branch?: string;
  commit: string;
  committer?: string;
  message?: string;
  remoteUrl?: string;
}

export interface QueryVariables {
  graph: string;
  variant: string;
  queryCountThreshold?: number;
  queryCountThresholdPercentage?: number;
  serviceName?: string;
  proposedSchema: {
    sdl: string;
  };
  gitContext: CommitDetails;
  queryParameters: {
    from: number;
  };
}

const getApolloConfigFile = async (file: string): Promise<ApolloConfigFile> => {
  try {
    const contents = JSON.parse(await readFile(file, 'utf8'));

    return contents;
  } catch {
    throw new Error(`Could not parse Apollo config file: ${file}`);
  }
};

const getCommitDetails = async (): Promise<CommitDetails> => {
  if (!process.env.GITHUB_REPOSITORY) {
    throw new Error('GITHUB_REPOSITORY is not set');
  }

  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
  const hash = process.env.GITHUB_SHA;
  const pullNumber = context?.payload.pull_request?.number;

  if (!owner || !repo || !hash || !pullNumber) {
    throw new Error('Could not determine repository details');
  }

  const octokit = new Octokit();
  const commitDetails = await octokit.repos.getCommit({ owner, repo, ref: hash });
  const pullDetails = await octokit.pulls.get({ owner, repo, pull_number: pullNumber });

  return {
    branch: pullDetails?.data?.head?.ref,
    commit: hash,
    committer: commitDetails?.data?.committer?.login,
    message: commitDetails?.data?.commit?.message,
    remoteUrl: commitDetails?.data?.html_url,
  };
};

const stringToNumber = (input?: string): number | undefined => {
  if (input && input !== '') {
    if (Number.isInteger(input)) {
      return Number.parseInt(input, 10);
    } else {
      return Number.parseFloat(input);
    }
  }
};

const getMergedConfig = async (config: ApolloConfigFile, inputs: ActionInputs): Promise<MergedConfig> => {
  const mergedConfig = {
    ...inputs,
    graph: config.graphId ?? inputs.graph,
    variant: config.variant ?? inputs.variant ?? 'current',
    serviceName: config.service?.name ?? inputs.serviceName,
    queryParameters: {
      from: Number.isInteger(inputs.validationPeriod)
        ? 0 - Number.parseInt(inputs.validationPeriod, 10)
        : 0 - toSeconds(parse(inputs.validationPeriod)),
      queryCountThreshold: stringToNumber(inputs.queryCountThreshold),
      queryCountThresholdPercentage: stringToNumber(inputs.queryCountThresholdPercentage),
    },
  };

  const schema = await getSchema({
    localSchemaFiles: config.service?.localSchemaFile ?? inputs.localSchemaFile,
    endpoint: config.service?.endpoint?.url ?? inputs.endpoint,
    headers: config.service?.endpoint?.headers ?? inputs.headers,
  });

  return { ...mergedConfig, proposedSchema: { sdl: schema } };
};

const getQueryVariables = async (): Promise<QueryVariables> => {
  const inputs = {
    config: getInput('config'),
    graph: getInput('graph'),
    variant: getInput('variant'),
    endpoint: getInput('endpoint'),
    headers: getInput('headers'),
    apolloKey: getInput('apolloKey'),
    localSchemaFile: getInput('localSchemaFile'),
    queryCountThreshold: getInput('queryCountThreshold'),
    queryCountThresholdPercentage: getInput('queryCountThresholdPercentage'),
    serviceName: getInput('serviceName'),
    validationPeriod: getInput('validationPeriod'),
  };

  debug(
    'arguments',
    Object.entries(inputs).filter(([key]) => key !== 'apolloApiKey')
  );

  if (!inputs.apolloKey) {
    throw new Error('You must provide an Apollo Studio API key');
  }

  if (!inputs.validationPeriod) {
    throw new Error('You must provide a validation period');
  }

  const apolloConfig = inputs.config ? await getApolloConfigFile(inputs.config) : {};
  const mergedConfig = await getMergedConfig(apolloConfig, inputs);
  const commitDetails = await getCommitDetails();

  if (!mergedConfig.graph) {
    throw new Error('You must provide a graph name');
  }

  if (!mergedConfig.proposedSchema.sdl) {
    throw new Error('You must provide a schema');
  }

  const variables: QueryVariables = {
    ...mergedConfig,
    graph: mergedConfig.graph,
    gitContext: commitDetails,
  };

  return variables;
};

export { getQueryVariables };

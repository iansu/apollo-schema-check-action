'use strict';

var util = require('util');
var core = require('@actions/core');
var github = require('@actions/github');
var action = require('@octokit/action');
var createDebug = require('debug');
var graphqlRequest = require('graphql-request');
var promises = require('fs/promises');
var iso8601Duration = require('iso8601-duration');
var graphql = require('graphql');
var prettyMs = require('pretty-ms');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var createDebug__default = /*#__PURE__*/_interopDefaultLegacy(createDebug);
var prettyMs__default = /*#__PURE__*/_interopDefaultLegacy(prettyMs);

/* eslint-disable @typescript-eslint/no-explicit-any */
const localDebug = createDebug__default["default"]('apollo-schema-check');
const isGitHubActions = () => !!process.env.GITHUB_WORKSPACE;
const debug = (...args) => {
    if (isGitHubActions()) {
        for (const arg of args) {
            core.debug(util.inspect(arg));
        }
    }
    else {
        localDebug(args);
    }
};
const info = (...args) => {
    if (isGitHubActions()) {
        for (const arg of args) {
            core.info(util.inspect(arg));
        }
    }
    else {
        console.log(args);
    }
};

const getSchema = async (args) => {
    let schema = '';
    if (args.localSchemaFiles) {
        const localSchemaFiles = typeof args.localSchemaFiles === 'string' ? [args.localSchemaFiles] : args.localSchemaFiles;
        for (const schemaFile of localSchemaFiles) {
            const contents = await promises.readFile(schemaFile.trim(), 'utf8');
            schema += `${contents}\n`;
        }
    }
    else if (args.endpoint) {
        let headers = {};
        if (typeof args.headers === 'string') {
            const headerKeyValues = args.headers.split(',').map((headerKeyValue) => headerKeyValue.trim());
            headerKeyValues.map((headerKeyValue) => {
                const [key, value] = headerKeyValue.split('=').map((value) => value.trim());
                headers[key] = value;
            });
        }
        else if (args.headers) {
            headers = args.headers;
        }
        try {
            const graphQLClient = new graphqlRequest.GraphQLClient(args.endpoint, {
                headers,
            });
            schema = await graphQLClient.request(graphql.getIntrospectionQuery());
        }
        catch (error) {
            throw new Error(JSON.stringify(error));
        }
    }
    else {
        throw new Error('You must provide either a path to a local schema file or an endpoint to introspect');
    }
    return schema;
};

const getCommitDetails = async () => {
    if (!process.env.GITHUB_REPOSITORY) {
        throw new Error('GITHUB_REPOSITORY is not set');
    }
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
    const hash = process.env.GITHUB_SHA;
    const pullNumber = github.context?.payload.pull_request?.number;
    if (!owner || !repo || !hash || !pullNumber) {
        throw new Error('Could not determine repository details');
    }
    const octokit = new action.Octokit();
    const commitDetails = await octokit.repos.getCommit({ owner, repo, ref: hash });
    const pullDetails = await octokit.pulls.get({ owner, repo, pull_number: pullNumber });
    debug('commitDetails', commitDetails);
    debug('pullDetails', pullDetails);
    return {
        branch: pullDetails?.data?.head?.ref,
        commit: hash,
        committer: commitDetails?.data?.author?.login,
        message: commitDetails?.data?.commit?.message,
        remoteUrl: commitDetails?.data?.html_url,
    };
};

const stringToNumber = (input) => {
    if (input && input !== '') {
        if (Number.isInteger(input)) {
            return Number.parseInt(input, 10);
        }
        else {
            return Number.parseFloat(input);
        }
    }
};
const getApolloConfigFile = async (file) => {
    try {
        const contents = JSON.parse(await promises.readFile(file, 'utf8'));
        return contents;
    }
    catch {
        throw new Error(`Could not parse Apollo config file: ${file}`);
    }
};
const getFromValue = (validationPeriod) => {
    if (validationPeriod.startsWith('P')) {
        return `${iso8601Duration.toSeconds(iso8601Duration.parse(validationPeriod))}`;
    }
    else if (validationPeriod.match(/^-?\d+$/)) {
        return `${Math.abs(Number.parseInt(validationPeriod))}`;
    }
    else {
        return validationPeriod;
    }
};
const getMergedConfig = async (config, inputs) => {
    const mergedConfig = {
        ...inputs,
        graph: config.graphId ?? inputs.graph,
        variant: config.variant ?? inputs.variant ?? 'current',
        serviceName: config.service?.name ?? inputs.serviceName,
        queryParameters: {
            from: getFromValue(inputs.validationPeriod),
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
const getQueryVariables = async () => {
    const inputs = {
        config: core.getInput('config'),
        graph: core.getInput('graph'),
        variant: core.getInput('variant'),
        endpoint: core.getInput('endpoint'),
        headers: core.getInput('headers'),
        apolloKey: core.getInput('key'),
        localSchemaFile: core.getInput('localSchemaFile'),
        queryCountThreshold: core.getInput('queryCountThreshold'),
        queryCountThresholdPercentage: core.getInput('queryCountThresholdPercentage'),
        serviceName: core.getInput('serviceName'),
        validationPeriod: core.getInput('validationPeriod'),
    };
    debug('arguments', Object.entries(inputs).filter(([key]) => key !== 'apolloApiKey'));
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
    const variables = {
        ...mergedConfig,
        graph: mergedConfig.graph,
        gitContext: commitDetails,
    };
    return variables;
};

const getValidationPeriod = (validationPeriod) => {
    if (validationPeriod.startsWith('P')) {
        return prettyMs__default["default"](iso8601Duration.toSeconds(iso8601Duration.parse(validationPeriod)) * 1000, { verbose: true });
    }
    else if (validationPeriod.match(/^-?\d+$/)) {
        return prettyMs__default["default"](Math.abs(Number.parseInt(validationPeriod)) * 1000, { verbose: true });
    }
    else {
        return validationPeriod;
    }
};
const getSummary = (checkSchemaResult, compositionValidationResult, variables) => {
    const numberOfCheckedOperations = checkSchemaResult?.diffToPrevious.numberOfCheckedOperations ?? 0;
    let summary = '';
    if (compositionValidationResult.compositionSuccess) {
        if (variables.serviceName) {
            summary += `🔄 Validated your local schema changes against metrics from variant \`${variables.variant}\` for service \`${variables.serviceName}\` on graph \`${variables.graph}\`\n`;
        }
        else {
            summary += `🔄 Validated your local schema changes against metrics from variant \`${variables.variant}\` on graph \`${variables.graph}\`\n`;
        }
        summary += `🔢 Compared **${checkSchemaResult?.diffToPrevious.changes.length} schema changes** against **${numberOfCheckedOperations} operations** seen over the **last ${getValidationPeriod(variables.queryParameters.from)}**\n`;
        if (checkSchemaResult?.diffToPrevious.severity === 'NOTICE' &&
            checkSchemaResult?.diffToPrevious.changes.length === 0) {
            summary += `✅ Found **no changes**\n\n`;
        }
        else if (checkSchemaResult?.diffToPrevious.severity === 'NOTICE')
            summary += `✅ Found **no breaking changes**\n\n`;
        else if (checkSchemaResult?.diffToPrevious.severity === 'WARNING' ||
            checkSchemaResult?.diffToPrevious.severity === 'FAILURE') {
            const issueCount = checkSchemaResult?.diffToPrevious.changes.filter((change) => change.severity === 'FAILURE' || change.severity === 'WARNING').length;
            summary += `❌ Found **${issueCount} breaking changes**\n\n`;
            core.setFailed('Breaking changes found');
        }
    }
    else {
        summary += `❌ Schema composition failed\n\n`;
        core.setFailed('Schema composition errors found');
    }
    if (checkSchemaResult?.targetUrl) {
        summary += `🔗 [View schema check details](${checkSchemaResult.targetUrl})\n`;
    }
    return summary;
};
const formatMessage = (output, variables, commentIdentifier, existingComment) => {
    const title = core.getInput('title');
    const alwaysComment = core.getInput('alwaysComment');
    const failOnError = core.getInput('failOnError');
    debug('Apollo Studio response', JSON.stringify(output, null, 2));
    const checkSchemaResult = output.service.checkPartialSchema.checkSchemaResult;
    const compositionValidationResult = output.service.checkPartialSchema.compositionValidationResult;
    if (alwaysComment !== 'true' && checkSchemaResult === null) {
        debug('alwaysComment is false and number of operations is null');
        debug('output', output);
        return;
    }
    if (!existingComment &&
        alwaysComment !== 'true' &&
        checkSchemaResult?.diffToPrevious.numberOfAffectedOperations === 0) {
        debug('existingComment is false, alwaysComment is false and there are zero schema changes');
        debug('output', output);
        return;
    }
    let message = `${commentIdentifier}\n\n`;
    if (failOnError && checkSchemaResult?.diffToPrevious.severity === 'FAILURE') {
        debug('Breaking changes found');
        debug('message', message);
        core.setFailed('Breaking changes found');
    }
    else if (failOnError && compositionValidationResult.compositionSuccess === false) {
        debug('Composition errors found');
        debug('message', message);
        core.setFailed('Schema composition errors found');
    }
    if (title) {
        message += `### Apollo Schema Check\n#### ${title}\n`;
    }
    else {
        message += `### Apollo Schema Check\n\n`;
    }
    message += getSummary(checkSchemaResult, compositionValidationResult, variables);
    if (compositionValidationResult.errors?.length) {
        message += '#### Schema Composition Errors\n\n```\n';
        for (const error of compositionValidationResult.errors) {
            message += `${error.message}\n`;
        }
        message += '```\n';
    }
    if (checkSchemaResult?.diffToPrevious.severity === 'FAILURE') {
        message += '#### Schema Change Errors\n\n```\n';
        for (const change of checkSchemaResult?.diffToPrevious.changes) {
            if (change.severity === 'FAILURE') {
                message += `${change.description}\n`;
            }
        }
        message += '```\n';
    }
    info('message', message);
    return message;
};

const apolloStudioEndpoint = 'https://graphql.api.apollographql.com/api/graphql';
const checkSchema = async (commentIdentifier, existingComment) => {
    const graphQLClient = new graphqlRequest.GraphQLClient(apolloStudioEndpoint, {
        headers: {
            'x-api-key': core.getInput('key'),
        },
    });
    const mutation = graphqlRequest.gql `
    mutation SubgraphCheckMutation(
      $graph: ID!
      $variant: String!
      $serviceName: String!
      $proposedSchema: PartialSchemaInput!
      $gitContext: GitContextInput!
      $queryParameters: HistoricQueryParameters!
    ) {
      service(id: $graph) {
        checkPartialSchema(
          graphVariant: $variant
          implementingServiceName: $serviceName
          partialSchema: $proposedSchema
          gitContext: $gitContext
          historicParameters: $queryParameters
        ) {
          compositionValidationResult {
            compositionSuccess
            errors {
              message
              code
              locations {
                line
                column
              }
            }
          }
          checkSchemaResult {
            diffToPrevious {
              severity
              numberOfCheckedOperations
              numberOfAffectedOperations
              changes {
                severity
                code
                description
              }
            }
            targetUrl
          }
        }
      }
    }
  `;
    try {
        const variables = await getQueryVariables();
        const data = await graphQLClient.request(mutation, variables);
        return formatMessage(data, variables, commentIdentifier, existingComment);
    }
    catch (error) {
        throw new Error(JSON.stringify(error));
    }
};

const getCommentIdentifier = () => {
    const config = core.getInput('config');
    const graph = core.getInput('graph');
    const variant = core.getInput('variant');
    const title = core.getInput('title');
    if (title) {
        return `<!-- apolloSchemaCheckAction name: ${title} -->`;
    }
    else if (config) {
        return `<!-- apolloSchemaCheckAction config: ${config} -->`;
    }
    else if (graph && variant) {
        return `<!-- apolloSchemaCheckAction graph: ${graph}@${variant} -->`;
    }
    else if (graph) {
        return `<!-- apolloSchemaCheckAction graph: ${graph} -->`;
    }
    else if (variant) {
        return `<!-- apolloSchemaCheckAction variant: ${variant} -->`;
    }
    else {
        return `<!-- apolloSchemaCheckAction -->`;
    }
};

const run = async () => {
    if (!isGitHubActions()) {
        console.log(await checkSchema(getCommentIdentifier(), false));
        return;
    }
    debug(process.env);
    debug(github.context);
    if (github.context.eventName !== 'pull_request') {
        core.setFailed('This action only works on the pull_request event');
        return;
    }
    const pullRequestNumber = process.env.GITHUB_REF?.match(/refs\/pull\/(\d+)\/merge/)?.[1];
    try {
        if (!pullRequestNumber) {
            core.setFailed('No pull request found');
            return;
        }
        const githubRepo = process.env.GITHUB_REPOSITORY;
        if (!githubRepo) {
            core.setFailed('No repo found');
            return;
        }
        const commentIdentifier = getCommentIdentifier();
        const [owner, repo] = githubRepo.split('/');
        const octokit = new action.Octokit();
        const comments = await octokit.issues.listComments({
            owner,
            repo,
            issue_number: Number.parseInt(pullRequestNumber, 10),
        });
        const existingComment = comments.data.find((comment) => comment?.body?.includes(commentIdentifier));
        const message = await checkSchema(commentIdentifier, !!existingComment);
        if (message) {
            if (existingComment) {
                octokit.issues.updateComment({
                    ...github.context.repo,
                    comment_id: existingComment.id,
                    body: message,
                });
            }
            else {
                octokit.issues.createComment({
                    ...github.context.repo,
                    issue_number: Number.parseInt(pullRequestNumber),
                    body: message,
                });
            }
        }
    }
    catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
        else {
            core.setFailed(util.inspect(error));
        }
    }
};
run();

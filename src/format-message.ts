import { getInput, setFailed } from '@actions/core';
import prettyMs from 'pretty-ms';

import { info, debug } from './actions';
import { ApolloStudioResponse, CheckSchemaResult, CompositionValidationResult } from './check-schema';
import { QueryVariables } from './get-arguments';

const getSummary = (
  checkSchemaResult: CheckSchemaResult | null,
  compositionValidationResult: CompositionValidationResult,
  variables: QueryVariables
): string => {
  const numberOfCheckedOperations = checkSchemaResult?.diffToPrevious.numberOfCheckedOperations ?? 0;

  let summary = '';

  if (compositionValidationResult.compositionSuccess) {
    if (variables.serviceName) {
      summary += `🔄 Validated your local schema changes against metrics from variant \`${variables.variant}\` for service \`${variables.serviceName}\` on graph \`${variables.graph}\`\n`;
    } else {
      summary += `🔄 Validated your local schema changes against metrics from variant \`${variables.variant}\` on graph \`${variables.graph}\`\n`;
    }

    summary += `🔢 Compared **${
      checkSchemaResult?.diffToPrevious.changes.length
    } schema changes** against **${numberOfCheckedOperations} operations** seen over the **last ${prettyMs(
      Math.abs(variables.queryParameters.from * 1_000),
      {
        compact: true,
      }
    )}**\n`;

    if (
      checkSchemaResult?.diffToPrevious.severity === 'NOTICE' &&
      checkSchemaResult?.diffToPrevious.changes.length === 0
    ) {
      summary += `✅ Found **no changes**\n\n`;
    } else if (checkSchemaResult?.diffToPrevious.severity === 'NOTICE')
      summary += `✅ Found **no breaking changes**\n\n`;
    else if (
      checkSchemaResult?.diffToPrevious.severity === 'WARNING' ||
      checkSchemaResult?.diffToPrevious.severity === 'FAILURE'
    ) {
      summary += `❌ Found **${checkSchemaResult?.diffToPrevious.changes.length} breaking changes**\n\n`;

      setFailed('Breaking changes found');
    }
  } else {
    summary += `❌ Schema composition failed\n\n`;

    setFailed('Schema composition errors found');
  }

  if (checkSchemaResult?.targetUrl) {
    summary += `🔗 [View schema check details](${checkSchemaResult.targetUrl})\n`;
  }

  return summary;
};

const formatMessage = (
  output: ApolloStudioResponse,
  variables: QueryVariables,
  commentIdentifier: string,
  existingComment: boolean
): string | undefined => {
  const title = getInput('title');
  const alwaysComment = getInput('alwaysComment');
  const failOnError = getInput('failOnError');

  info('Apollo Studio response');
  info(output);

  const checkSchemaResult = output.service.checkPartialSchema.checkSchemaResult;
  const compositionValidationResult = output.service.checkPartialSchema.compositionValidationResult;

  if (alwaysComment !== 'true' && checkSchemaResult === null) {
    debug('alwaysComment is false and number of operations is null');
    debug('output', output);

    return;
  }

  if (
    !existingComment &&
    alwaysComment !== 'true' &&
    checkSchemaResult?.diffToPrevious.numberOfAffectedOperations === 0
  ) {
    debug('existingComment is false, alwaysComment is false and there are zero schema changes');
    debug('output', output);

    return;
  }

  let message = `${commentIdentifier}\n\n`;

  if (failOnError && checkSchemaResult?.diffToPrevious.severity === 'FAILURE') {
    debug('Breaking changes found');
    debug('message', message);
    setFailed('Breaking changes found');
  } else if (failOnError && compositionValidationResult.compositionSuccess === false) {
    debug('Composition errors found');
    debug('message', message);
    setFailed('Schema composition errors found');
  }

  if (title) {
    message += `### Apollo Schema Check\n#### ${title}\n`;
  } else {
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

  info('message', message);

  return message;
};

export { formatMessage };

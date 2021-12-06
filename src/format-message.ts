import { getInput, setFailed } from '@actions/core';
import prettyMs from 'pretty-ms';

import { info, debug } from './actions';
import { ApolloStudioResponse } from './check-schema';
import { QueryVariables } from './get-arguments';

const getSummary = (output: ApolloStudioResponse, variables: QueryVariables): string => {
  let summary = '';

  if (output.service.checkPartialSchema.compositionValidationResult.compositionSuccess) {
    if (variables.serviceName) {
      summary += `🔄 Validated your local schema changes against metrics from variant \`${variables.variant}\` for service \`${variables.serviceName}\` on graph \`${variables.graph}\`\n`;
    } else {
      summary += `🔄 Validated your local schema changes against metrics from variant \`${variables.variant}\` on graph \`${variables.graph}\`\n`;
    }

    summary += `🔢 Compared **${
      output.service.checkPartialSchema.checkSchemaResult?.diffToPrevious.changes.length
    } schema changes** against **${
      output.service.checkPartialSchema.checkSchemaResult?.diffToPrevious.numberOfCheckedOperations
    } operations** seen over the **last ${prettyMs(Math.abs(variables.queryParameters.from), { compact: true })}**\n`;

    if (
      output.service.checkPartialSchema.checkSchemaResult?.diffToPrevious.severity === 'NOTICE' &&
      output.service.checkPartialSchema.checkSchemaResult?.diffToPrevious.changes.length === 0
    ) {
      summary += `✅ Found **no changes**\n\n`;
    } else if (output.service.checkPartialSchema.checkSchemaResult?.diffToPrevious.severity === 'NOTICE')
      summary += `✅ Found **no breaking changes**\n\n`;
    else if (
      output.service.checkPartialSchema.checkSchemaResult?.diffToPrevious.severity === 'WARNING' ||
      output.service.checkPartialSchema.checkSchemaResult?.diffToPrevious.severity === 'FAILURE'
    ) {
      summary += `❌ Found **${output.service.checkPartialSchema.checkSchemaResult?.diffToPrevious.changes.length} breaking changes**\n\n`;
    }
  } else {
    summary += `❌ Schema composition failed.\n\n`;
  }

  if (output.service.checkPartialSchema.checkSchemaResult?.targetUrl) {
    summary += `🔗 [View schema check details](${output.service.checkPartialSchema.checkSchemaResult.targetUrl})\n`;
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

  info(output);

  if (alwaysComment !== 'true' && output.service.checkPartialSchema.checkSchemaResult === null) {
    debug('alwaysComment is false and number of operations is null');
    debug('output', output);

    return;
  }

  if (
    !existingComment &&
    alwaysComment !== 'true' &&
    output.service.checkPartialSchema.checkSchemaResult?.diffToPrevious.numberOfAffectedOperations === 0
  ) {
    debug('existingComment is false, alwaysComment is false and there are zero schema changes');
    debug('output', output);

    return;
  }

  let message = `${commentIdentifier}\n\n`;

  if (failOnError && /\d+ breaking change/.test(message)) {
    debug('Breaking changes found');
    debug('message', message);
    setFailed('Breaking changes found');
  } else if (failOnError && /\d+ composition error/.test(message)) {
    debug('Composition errors found');
    debug('message', message);
    setFailed('Composition errors found');
  }

  if (title) {
    message += `### Apollo Schema Check\n#### ${title}\n`;
  } else {
    message += `### Apollo Schema Check\n\n`;
  }

  message += getSummary(output, variables);

  if (output.service.checkPartialSchema.compositionValidationResult.errors?.length) {
    message += '#### Schema Composition Errors\n';

    for (const error of output.service.checkPartialSchema.compositionValidationResult.errors) {
      message += `- \`${error.message}\`\n`;
    }
  }

  debug('message', message);

  return message;
};

export { formatMessage };

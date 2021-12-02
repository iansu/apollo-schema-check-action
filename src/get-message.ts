import execa from 'execa';
import { getInput } from '@actions/core';

import { debug, info, error as logError } from './actions';
import { getArguments } from './get-arguments';
import { formatMessage } from './format-message';

const getMessage = async (
  commentIdentifier: string,
  existingComment: boolean
): Promise<string | undefined> => {
  const args = getArguments();
  const apolloCliVersion = getInput('apolloVersion');

  if (existingComment) {
    debug('existing comment found');
  }

  const redactedArgs = args.map((arg) =>
    arg.startsWith('--key') ? arg.replace(/:[^:]+$/, '***') : arg
  );

  info(
    'Apollo CLI command',
    ['npx', `apollo@${apolloCliVersion}`, 'schema:check', ...redactedArgs].join(' ')
  );

  try {
    const output = (await execa('npx', [`apollo@${apolloCliVersion}`, 'schema:check', ...args]))
      .stdout;

    info('Apollo CLI output', output);

    const message = formatMessage(output, existingComment);

    if (message) {
      return `${message}\n\n${commentIdentifier}`;
    } else {
      return;
    }
  } catch (error) {
    logError(`Apollo CLI error: exit code ${error.exitCode}`, error);

    if (error.exitCode !== 1) {
      throw new Error('Error running Apollo CLI');
    } else {
      const message = formatMessage(error.stdout, existingComment);

      if (message) {
        return `${message}\n\n${commentIdentifier}`;
      } else {
        return;
      }
    }
  }
};

export { getMessage };

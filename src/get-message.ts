import execa from 'execa';

import { debug, info } from './actions';
import { getArguments } from './get-arguments';
import { formatMessage } from './format-message';

const getMessage = async (
  commentIdentifier: string,
  existingComment: boolean
): Promise<string | undefined> => {
  const args = getArguments();

  if (existingComment) {
    debug('existing comment found');
  }

  const redactedArgs = args.map((arg) =>
    arg.startsWith('--key') ? arg.replace(/:[^:]+$/, '***') : arg
  );

  info('Apollo CLI command', ['npx', 'apollo@2.33.9', 'schema:check', ...redactedArgs].join(' '));

  try {
    const output = (await execa('npx', ['apollo@2.33.9', 'schema:check', ...args])).stdout;

    info('Apollo CLI output', output);

    const message = formatMessage(output, existingComment);

    if (message) {
      return `${message}\n\n${commentIdentifier}`;
    } else {
      return;
    }
  } catch (error) {
    info(`Apollo CLI error: exit code ${error.exitCode}`, error);

    if (error.exitCode !== 1) {
      throw new Error('Error running Apollo CLI');
    } else {
      info('stdout', error.stdout);
      info('stderr', error.stderr);

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

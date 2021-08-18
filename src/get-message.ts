import execa from 'execa';

import { debug } from './actions';
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

  console.log(
    'Apollo CLI command',
    ['npx', 'apollo@2.33.6', 'schema:check', ...redactedArgs].join(' ')
  );

  try {
    const output = (await execa('npx', ['apollo@2.33.6', 'schema:check', ...args])).stdout;

    console.log(output);

    const message = formatMessage(output, existingComment);

    if (message) {
      return `${message}\n\n${commentIdentifier}`;
    } else {
      return;
    }
  } catch (error) {
    if (error.exitCode !== 1) {
      console.error(`Apollo CLI error: exit code ${error.exitCode}`, error);

      throw new Error('Error running Apollo CLI');
    } else {
      console.log(error.stdout);

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

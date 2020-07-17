import execa from 'execa';

import { debug } from './actions';
import { getArguments } from './get-arguments';
import { formatMessage } from './format-message';

const getMessage = async (
  commentHeader: string,
  existingComment: boolean
): Promise<string | undefined> => {
  const args = getArguments();

  if (existingComment) {
    debug('existing comment found');
  }

  try {
    const output = (await execa('npx', ['apollo@2.28.3', 'schema:check', ...args])).stdout;
    const message = formatMessage(output, existingComment);

    if (message) {
      return `${commentHeader}\n\n${message}`;
    } else {
      return;
    }
  } catch (error) {
    if (error.exitCode !== 1) {
      debug('Apollo CLI error', error);

      throw new Error('Error running Apollo CLI');
    } else {
      const message = formatMessage(error.stdout, existingComment);

      if (message) {
        return `${commentHeader}\n\n${message}`;
      } else {
        return;
      }
    }
  }
};

export { getMessage };

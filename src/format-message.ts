import { getInput, setFailed } from '@actions/core';

import { debug } from './actions';

const formatMessage = (output: string, existingComment: boolean): string | undefined => {
  const startOfMessage = output.indexOf('###');
  const title = getInput('title');
  const alwaysComment = getInput('alwaysComment');
  const failOnError = getInput('failOnError');

  if (startOfMessage === -1) {
    throw new Error('Error running Apollo CLI');
  }

  if (alwaysComment !== 'true' && output.includes('null operations')) {
    debug('alwaysComment is false and number of operations is null');
    debug('output', output);

    return;
  }

  if (!existingComment && alwaysComment !== 'true' && /\s0 schema changes/.test(output)) {
    debug('existingComment is false, alwaysComment is false and there are zero schema changes');
    debug('output', output);

    return;
  }

  let message = output.slice(startOfMessage);

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
    message = message.replace(
      '### Apollo Service Check\n',
      `### Apollo Schema Check\n#### ${title}\n`
    );
  } else {
    message = message.replace('### Apollo Service Check', `### Apollo Schema Check`);
  }

  debug('message', message);

  return message;
};

export { formatMessage };

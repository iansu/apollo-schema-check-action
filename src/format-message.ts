// import { getInput, setFailed } from '@actions/core';

import { info } from './actions';

const formatMessage = (output: string, commentIdentifier: string): string | undefined => {
  info(output);
  // const startOfMessage = output.indexOf('###');
  // const title = getInput('title');
  // const alwaysComment = getInput('alwaysComment');
  // const failOnError = getInput('failOnError');

  // if (startOfMessage === -1) {
  //   throw new Error('Received unexpected output from Apollo CLI');
  // }

  // if (alwaysComment !== 'true' && output.includes('null operations')) {
  //   debug('alwaysComment is false and number of operations is null');
  //   debug('output', output);

  //   return;
  // }

  // if (!existingComment && alwaysComment !== 'true' && /\s0 schema changes/.test(output)) {
  //   debug('existingComment is false, alwaysComment is false and there are zero schema changes');
  //   debug('output', output);

  //   return;
  // }

  // let message = output.slice(startOfMessage);

  // if (failOnError && /\d+ breaking change/.test(message)) {
  //   debug('Breaking changes found');
  //   debug('message', message);
  //   setFailed('Breaking changes found');
  // } else if (failOnError && /\d+ composition error/.test(message)) {
  //   debug('Composition errors found');
  //   debug('message', message);
  //   setFailed('Composition errors found');
  // }

  // if (title) {
  //   message = message.replace(
  //     '### Apollo Service Check\n',
  //     `### Apollo Schema Check\n#### ${title}\n`
  //   );
  // } else {
  //   message = message.replace('### Apollo Service Check', `### Apollo Schema Check`);
  // }

  // debug('message', message);

  // return message;

  let message = `${commentIdentifier}\n\n`;

  // if (title) {
  //   message += `### Apollo Schema Check\n#### ${title}\n`;
  // }

  message += `### Apollo Schema Check\n\n`;

  return message;
};

export { formatMessage };

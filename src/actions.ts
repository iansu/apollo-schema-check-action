/* eslint-disable @typescript-eslint/no-explicit-any */

import { inspect } from 'util';
import createDebug from 'debug';
import { debug as githubDebug } from '@actions/core';

const localDebug = createDebug('apollo-schema-check');

const isGitHubActions = (): boolean => !!process.env.GITHUB_WORKSPACE;

const debug = (...args: any[]): void => {
  if (isGitHubActions()) {
    for (const arg of args) {
      githubDebug(inspect(arg));
    }
  } else {
    localDebug(args);
  }
};

export { isGitHubActions, debug };

/* eslint-disable @typescript-eslint/no-explicit-any */

import { inspect } from 'util';
import createDebug from 'debug';
import { debug as githubDebug, info as githubInfo, error as githubError } from '@actions/core';

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

const info = (...args: any[]): void => {
  if (isGitHubActions()) {
    for (const arg of args) {
      githubInfo(inspect(arg));
    }
  } else {
    console.log(args);
  }
};

const error = (...args: any[]): void => {
  if (isGitHubActions()) {
    for (const arg of args) {
      githubError(inspect(arg));
    }
  } else {
    console.error(args);
  }
};

export { isGitHubActions, debug, info, error };

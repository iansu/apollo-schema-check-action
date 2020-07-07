/* eslint-disable @typescript-eslint/no-explicit-any */

import createDebug from 'debug';
import { debug as githubDebug } from '@actions/core';

const localDebug = createDebug('apollo-schema-check');

const getWorkspace = (): string => process.env.GITHUB_WORKSPACE || process.cwd();
const isGitHubActions = (): boolean => !!process.env.GITHUB_WORKSPACE;

const debug = (...args: any[]): void => {
  if (isGitHubActions()) {
    githubDebug(args.join('\n'));
  } else {
    localDebug(args);
  }
};

export { getWorkspace, isGitHubActions, debug };

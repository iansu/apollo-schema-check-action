import { Octokit } from '@octokit/action';
import { context } from '@actions/github';

import { debug } from './actions-helpers';

export interface CommitDetails {
  branch?: string;
  commit: string;
  committer?: string;
  message?: string;
  remoteUrl?: string;
}

const getCommitDetails = async (): Promise<CommitDetails> => {
  if (!process.env.GITHUB_REPOSITORY) {
    throw new Error('GITHUB_REPOSITORY is not set');
  }

  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
  const hash = process.env.GITHUB_SHA;
  const pullNumber = context?.payload.pull_request?.number;

  if (!owner || !repo || !hash || !pullNumber) {
    throw new Error('Could not determine repository details');
  }

  const octokit = new Octokit();
  const commitDetails = await octokit.repos.getCommit({ owner, repo, ref: hash });
  const pullDetails = await octokit.pulls.get({ owner, repo, pull_number: pullNumber });

  debug('commitDetails', commitDetails);
  debug('pullDetails', pullDetails);

  return {
    branch: pullDetails?.data?.head?.ref,
    commit: hash,
    committer: commitDetails?.data?.author?.login,
    message: commitDetails?.data?.commit?.message,
    remoteUrl: commitDetails?.data?.html_url,
  };
};

export { getCommitDetails };

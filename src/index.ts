import { inspect } from 'util';

import { setFailed } from '@actions/core';
import { context } from '@actions/github';
import { Octokit } from '@octokit/action';

import { isGitHubActions, debug } from './actions';
import { checkSchema } from './check-schema';
import { getCommentIdentifier } from './get-comment-identifier';

const run = async (): Promise<void> => {
  if (!isGitHubActions()) {
    console.log(await checkSchema(getCommentIdentifier(), false));

    return;
  }

  debug(process.env);
  debug(context);

  if (context.eventName !== 'pull_request') {
    setFailed('This action only works on the pull_request event');

    return;
  }

  const pullRequestNumber = process.env.GITHUB_REF?.match(/refs\/pull\/(\d+)\/merge/)?.[1];

  try {
    if (!pullRequestNumber) {
      setFailed('No pull request found');

      return;
    }

    const githubRepo = process.env.GITHUB_REPOSITORY;

    if (!githubRepo) {
      setFailed('No repo found');

      return;
    }

    const commentIdentifier = getCommentIdentifier();
    const [owner, repo] = githubRepo.split('/');
    const octokit = new Octokit();
    const comments = await octokit.issues.listComments({
      owner,
      repo,
      issue_number: Number.parseInt(pullRequestNumber, 10),
    });
    const existingComment = comments.data.find((comment) => comment?.body?.includes(commentIdentifier));
    const message = await checkSchema(commentIdentifier, !!existingComment);

    if (message) {
      if (existingComment) {
        octokit.issues.updateComment({
          ...context.repo,
          comment_id: existingComment.id,
          body: message,
        });
      } else {
        octokit.issues.createComment({
          ...context.repo,
          issue_number: Number.parseInt(pullRequestNumber),
          body: message,
        });
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      setFailed(error.message);
    } else {
      setFailed(inspect(error));
    }
  }
};

run();

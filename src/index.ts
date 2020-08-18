/* eslint-disable @typescript-eslint/camelcase */

import { setFailed } from '@actions/core';
import { context } from '@actions/github';
import { Octokit } from '@octokit/action';

import { isGitHubActions } from './actions';
import { getCommentIdentifier } from './get-comment-identifier';
import { getMessage } from './get-message';

const run = async (): Promise<void> => {
  if (!isGitHubActions()) {
    console.log(await getMessage(getCommentIdentifier(), false));

    return;
  }

  try {
    if (context.payload.pull_request == null) {
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
    const pullRequestNumber = context.payload.pull_request.number;
    const octokit = new Octokit();
    const comments = await octokit.issues.listComments({
      owner,
      repo,
      issue_number: pullRequestNumber
    });
    const existingComment = comments.data.find(comment => comment.body.includes(commentIdentifier));
    const message = await getMessage(commentIdentifier, !!existingComment);

    if (message) {
      if (existingComment) {
        octokit.issues.updateComment({
          ...context.repo,
          comment_id: existingComment.id,
          body: message
        });
      } else {
        octokit.issues.createComment({
          ...context.repo,
          issue_number: pullRequestNumber,
          body: message
        });
      }
    }
  } catch (error) {
    setFailed(error.message);
  }
};

run();

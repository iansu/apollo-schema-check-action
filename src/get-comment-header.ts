import { getInput } from '@actions/core';

const getCommentHeader = (): string => {
  const config = getInput('config');
  const graph = getInput('graph');
  const variant = getInput('variant');
  const title = getInput('title');

  if (title) {
    return `<!-- apolloSchemaCheckAction name: ${title} -->`;
  } else if (config) {
    return `<!-- apolloSchemaCheckAction config: ${config} -->`;
  } else if (graph && variant) {
    return `<!-- apolloSchemaCheckAction graph: ${graph}@${variant} -->`;
  } else if (graph) {
    return `<!-- apolloSchemaCheckAction graph: ${graph} -->`;
  } else if (variant) {
    return `<!-- apolloSchemaCheckAction variant: ${variant} -->`;
  } else {
    return `<!-- apolloSchemaCheckAction -->`;
  }
};

export { getCommentHeader };

import * as core from '@actions/core';
import { when } from 'jest-when';

import { getCommentIdentifier } from '../src/get-comment-identifier';

const mockGetInput = jest.spyOn(core, 'getInput');

describe('getCommentIdentifier', () => {
  test('get header with title', () => {
    when(mockGetInput).calledWith('title').mockReturnValueOnce('Customer API');

    expect(getCommentIdentifier()).toBe('<!-- apolloSchemaCheckAction name: Customer API -->');
  });

  test('get header with config', () => {
    when(mockGetInput).calledWith('config').mockReturnValueOnce('apollo.config.js');

    expect(getCommentIdentifier()).toBe('<!-- apolloSchemaCheckAction config: apollo.config.js -->');
  });

  test('get header with graph and variant', () => {
    when(mockGetInput).calledWith('graph').mockReturnValueOnce('my-customer-api');
    when(mockGetInput).calledWith('variant').mockReturnValueOnce('production');

    expect(getCommentIdentifier()).toBe('<!-- apolloSchemaCheckAction graph: my-customer-api@production -->');
  });

  test('get header with graph', () => {
    when(mockGetInput).calledWith('graph').mockReturnValueOnce('my-customer-api');

    expect(getCommentIdentifier()).toBe('<!-- apolloSchemaCheckAction graph: my-customer-api -->');
  });

  test('get header with variant', () => {
    when(mockGetInput).calledWith('variant').mockReturnValueOnce('production');

    expect(getCommentIdentifier()).toBe('<!-- apolloSchemaCheckAction variant: production -->');
  });

  test('get header with nothing', () => {
    expect(getCommentIdentifier()).toBe('<!-- apolloSchemaCheckAction -->');
  });
});

import * as core from '@actions/core';
import { when } from 'jest-when';

import { getArguments } from '../src/get-arguments';

const mockGetInput = jest.spyOn(core, 'getInput');

describe.skip('getArguments', () => {
  test('graph with no key throws', () => {
    when(mockGetInput).calledWith('graph').mockReturnValueOnce('my-customer-api');
    when(mockGetInput).calledWith('key').mockReturnValueOnce('');

    expect(() => getArguments()).toThrow('You must provide an Apollo key');
  });

  test('no graph and no config throws', () => {
    when(mockGetInput).calledWith('config').mockReturnValueOnce('');
    when(mockGetInput).calledWith('graph').mockReturnValueOnce('');

    expect(() => getArguments()).toThrow('You must provide either a config file or a graph name');
  });

  test('no headers does not set argument', () => {
    when(mockGetInput).calledWith('graph').mockReturnValueOnce('my-customer-api');
    when(mockGetInput).calledWith('key').mockReturnValueOnce('secret-key');
    when(mockGetInput).calledWith('headers').mockReturnValueOnce('');

    const args = getArguments();

    expect(args).toContain('--graph=my-customer-api');
    expect(args).toContain('--key=secret-key');
    expect(args).toContain('--markdown');
  });

  test('one header sets on argument', () => {
    when(mockGetInput).calledWith('graph').mockReturnValueOnce('my-customer-api');
    when(mockGetInput).calledWith('key').mockReturnValueOnce('secret-key');
    when(mockGetInput).calledWith('header').mockReturnValueOnce('X-My-Header-1=Hello');

    const args = getArguments();

    expect(args).toContain('--graph=my-customer-api');
    expect(args).toContain('--key=secret-key');
    expect(args).toContain('--markdown');
    expect(args).toContain("--header='X-My-Header-1=Hello'");
  });

  test('two headers sets two arguments', () => {
    when(mockGetInput).calledWith('graph').mockReturnValueOnce('my-customer-api');
    when(mockGetInput).calledWith('key').mockReturnValueOnce('secret-key');
    when(mockGetInput).calledWith('header').mockReturnValueOnce('X-My-Header-1=Hello, X-My-Header-2=World');

    const args = getArguments();

    expect(args).toContain('--graph=my-customer-api');
    expect(args).toContain('--key=secret-key');
    expect(args).toContain('--markdown');
    expect(args).toContain("--header='X-My-Header-1=Hello'");
    expect(args).toContain("--header='X-My-Header-2=World'");
  });

  test('all arguments pass through', () => {
    when(mockGetInput).calledWith('config').mockReturnValueOnce('apollo.config.js');
    when(mockGetInput).calledWith('graph').mockReturnValueOnce('my-customer-api');
    when(mockGetInput).calledWith('variant').mockReturnValueOnce('production');
    when(mockGetInput).calledWith('endpoint').mockReturnValueOnce('http://localhost:8000/graphql');
    when(mockGetInput).calledWith('header').mockReturnValueOnce('X-My-Header-1=Hello,X-My-Header-2=World');
    when(mockGetInput).calledWith('key').mockReturnValueOnce('secret-key');
    when(mockGetInput).calledWith('localSchemaFile').mockReturnValueOnce('customer-api.graphql');
    when(mockGetInput).calledWith('queryCountThreshold').mockReturnValueOnce('1');
    when(mockGetInput).calledWith('queryCountThresholdPercentage').mockReturnValueOnce('5');
    when(mockGetInput).calledWith('serviceName').mockReturnValueOnce('my-service');
    when(mockGetInput).calledWith('validationPeriod').mockReturnValueOnce('p2w');

    const args = getArguments();

    expect(args).toContain('--config=apollo.config.js');
    expect(args).toContain('--graph=my-customer-api');
    expect(args).toContain('--variant=production');
    expect(args).toContain('--endpoint=http://localhost:8000/graphql');
    expect(args).toContain("--header='X-My-Header-1=Hello'");
    expect(args).toContain("--header='X-My-Header-2=World'");
    expect(args).toContain('--key=secret-key');
    expect(args).toContain('--localSchemaFile=customer-api.graphql');
    expect(args).toContain('--queryCountThreshold=1');
    expect(args).toContain('--queryCountThresholdPercentage=5');
    expect(args).toContain('--serviceName=my-service');
    expect(args).toContain('--validationPeriod=p2w');
    expect(args).toContain('--markdown');
  });
});

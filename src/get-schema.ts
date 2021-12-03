import { readFile } from 'fs/promises';

export interface GetSchemaArgs {
  localSchemaFiles?: string | string[];
  endpoint?: string;
  headers?: string | { [key: string]: string };
}

const getSchema = async (args: GetSchemaArgs): Promise<string> => {
  let schema = '';

  if (args.localSchemaFiles) {
    const localSchemaFiles =
      typeof args.localSchemaFiles === 'string' ? [args.localSchemaFiles] : args.localSchemaFiles;

    for (const schemaFile of localSchemaFiles) {
      const contents = await readFile(schemaFile.trim(), 'utf8');

      schema += `${contents}\n`;
    }
  } else if (args.endpoint) {
    let headers: { [key: string]: string } = {};

    if (typeof args.headers === 'string') {
      const headerKeyValues = args.headers.split(',').map((headerKeyValue) => headerKeyValue.trim());

      headerKeyValues.map((headerKeyValue: string) => {
        const [key, value] = headerKeyValue.split('=').map((value) => value.trim());

        headers[key] = value;
      });
    } else if (args.headers) {
      headers = args.headers;
    }

    // TODO: introspect schema from local endpoint
  } else {
    throw new Error('You must provide either a path to a local schema file or an endpoint to introspect');
  }

  return schema;
};

export { getSchema };

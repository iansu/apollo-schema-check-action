import { GraphQLClient, gql } from 'graphql-request';
import { getInput } from '@actions/core';

import { debug } from './actions-helpers';
import { getQueryVariables, QueryVariables } from './get-arguments';
import { formatMessage } from './format-message';

export interface CompositionValidationErrorLocation {
  line: number;
  column: number;
}

export interface CompositionValidationError {
  message: string;
  code: string;
  locations: CompositionValidationErrorLocation[];
}

export interface CompositionValidationResult {
  compositionSuccess: boolean;
  errors: CompositionValidationError[] | null;
}

export interface DiffToPreviousChanges {
  severity: string;
  code: string;
  description: string;
}

export interface DiffToPrevious {
  severity: string;
  numberOfCheckedOperations: number;
  numberOfAffectedOperations: number;
  changes: DiffToPreviousChanges[];
}

export interface CheckSchemaResult {
  diffToPrevious: DiffToPrevious;
  targetUrl: string;
}

export interface ApolloStudioResponse {
  service: {
    checkPartialSchema: {
      compositionValidationResult: CompositionValidationResult;
      checkSchemaResult: CheckSchemaResult | null;
    };
  };
}

const apolloStudioEndpoint = 'https://graphql.api.apollographql.com/api/graphql';

const checkSchema = async (commentIdentifier: string, existingComment: boolean): Promise<string | undefined> => {
  const graphQLClient = new GraphQLClient(apolloStudioEndpoint, {
    headers: {
      'x-api-key': getInput('key'),
    },
  });

  const mutation = gql`
    mutation SubgraphCheckMutation(
      $graph: ID!
      $variant: String!
      $serviceName: String!
      $proposedSchema: PartialSchemaInput!
      $gitContext: GitContextInput!
      $queryParameters: HistoricQueryParameters!
    ) {
      service(id: $graph) {
        checkPartialSchema(
          graphVariant: $variant
          implementingServiceName: $serviceName
          partialSchema: $proposedSchema
          gitContext: $gitContext
          historicParameters: $queryParameters
        ) {
          compositionValidationResult {
            compositionSuccess
            errors {
              message
              code
              locations {
                line
                column
              }
            }
          }
          checkSchemaResult {
            diffToPrevious {
              severity
              numberOfCheckedOperations
              numberOfAffectedOperations
              changes {
                severity
                code
                description
              }
            }
            targetUrl
          }
        }
      }
    }
  `;

  try {
    const variables = await getQueryVariables();

    debug('Apollo Studio request variables', JSON.stringify(variables, null, 2));
    
    const data = await graphQLClient.request<ApolloStudioResponse, QueryVariables>(mutation, variables);

    return formatMessage(data, variables, commentIdentifier, existingComment);
  } catch (error) {
    throw new Error(JSON.stringify(error));
  }
};

export { checkSchema };

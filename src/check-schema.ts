import { GraphQLClient, gql } from 'graphql-request';
import { getInput } from '@actions/core';

import { getQueryVariables, QueryVariables } from './get-arguments';
import { formatMessage } from './format-message';

export interface ApolloStudioResponse {
  service: {
    checkPartialSchema: {
      compositionValidationResult: {
        compositionSuccess: boolean;
        errors:
          | {
              message: string;
              code: string;
              locations: {
                line: number;
                column: number;
              }[];
            }[]
          | null;
      };
      checkSchemaResult: {
        diffToPrevious: {
          severity: string;
          numberOfCheckedOperations: number;
          numberOfAffectedOperations: number;
          changes: {
            severity: string;
            code: string;
            description: string;
          }[];
        };
        targetUrl: string;
      } | null;
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
    const data = await graphQLClient.request<ApolloStudioResponse, QueryVariables>(mutation, variables);

    return formatMessage(data, variables, commentIdentifier, existingComment);
  } catch (error) {
    throw new Error(JSON.stringify(error));
  }
};

export { checkSchema };

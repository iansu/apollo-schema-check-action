import { GraphQLClient, gql } from 'graphql-request';
import { getInput } from '@actions/core';

import { getQueryVariables } from './get-arguments';
import { formatMessage } from './format-message';

const apolloStudioEndpoint = 'https://graphql.api.apollographql.com/api/graphql';

const checkSchema = async (commentIdentifier: string): Promise<string | undefined> => {
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

  const variables = await getQueryVariables();
  const data = await graphQLClient.request(mutation, variables);

  return formatMessage(data, commentIdentifier);
};

export { checkSchema };

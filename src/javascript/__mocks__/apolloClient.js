// Mock @apollo/client so the config panel can be unit-tested without a network.
import React from 'react';

export class InMemoryCache {}

export class ApolloClient {
    constructor(opts) {
        this.opts = opts;
    }
}

export const ApolloProvider = ({children}) => <>{children}</>;

// Default no-op implementations; individual tests override via jest.spyOn / mockReturnValue.
export const useQuery = jest.fn(() => ({data: undefined, loading: false, error: undefined}));

export const useMutation = jest.fn(() => [jest.fn(() => Promise.resolve({data: {}})), {loading: false}]);

import React from 'react';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {useMutation, useQuery} from '@apollo/client';
import {StatuspageIoConfigPanel} from '../StatuspageIoConfigPanel';

// UseQuery / useMutation come from the @apollo/client manual mock.
const mockUseQuery = useQuery;
const mockUseMutation = useMutation;

describe('StatuspageIoConfigPanel', () => {
    beforeEach(() => {
        mockUseQuery.mockReset();
        mockUseMutation.mockReset();
        mockUseQuery.mockReturnValue({
            data: {statuspageIo: {config: {pageId: 'initial-id'}}},
            loading: false,
            error: undefined
        });
    });

    test('announces success in the live region after a successful save', async () => {
        const updateConfig = jest.fn(() => Promise.resolve({data: {statuspageIo: {updateConfig: true}}}));
        mockUseMutation.mockReturnValue([updateConfig, {loading: false}]);

        render(<StatuspageIoConfigPanel/>);

        // Pre-populated from the query
        const input = screen.getByDisplayValue('initial-id');
        fireEvent.change(input, {target: {value: 'new-id'}});

        fireEvent.click(screen.getByText('label.admin.save'));

        await waitFor(() => {
            expect(updateConfig).toHaveBeenCalledWith({variables: {pageId: 'new-id'}});
        });

        // The persistent polite live region shows the saved key.
        await waitFor(() => {
            const region = screen.getByRole('status');
            expect(region).toHaveTextContent('label.admin.saved');
        });
    });

    test('announces an error in the alert region when the save fails', async () => {
        const updateConfig = jest.fn(() => Promise.reject(new Error('boom')));
        mockUseMutation.mockReturnValue([updateConfig, {loading: false}]);

        render(<StatuspageIoConfigPanel/>);

        fireEvent.click(screen.getByText('label.admin.save'));

        await waitFor(() => {
            const alert = screen.getByRole('alert');
            expect(alert).toHaveTextContent('label.admin.saveError');
        });

        // The input is flagged invalid and described by the error span.
        const input = screen.getByDisplayValue('initial-id');
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAttribute('aria-describedby', 'statuspageio-pageId-error');
    });

    test('shows a loading region while the query is in flight', () => {
        mockUseQuery.mockReturnValue({data: undefined, loading: true, error: undefined});
        mockUseMutation.mockReturnValue([jest.fn(), {loading: false}]);

        render(<StatuspageIoConfigPanel/>);

        expect(screen.getByRole('status')).toHaveTextContent('label.admin.loading');
    });
});

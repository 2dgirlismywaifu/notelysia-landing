import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import ServiceList from '../../../src/components/services/ServiceList';
import type { Service } from '../../../src/config/site';

afterEach(cleanup);

const services: Service[] = Array.from({ length: 5 }, (_, index) => ({
    name: `Service ${index + 1}`,
    description: `Description ${index + 1}`,
    color: 'blue',
    icon: 'cloud',
    url: `https://service-${index + 1}.example.com`,
}));

describe('ServiceList', () => {
    it('shows four services per page and navigates between pages', () => {
        const { container } = render(<ServiceList services={services} />);
        expect(container.querySelectorAll('.service-card')).toHaveLength(4);
        expect(screen.getByRole('link', { name: /Service 1/ })).toBeTruthy();
        expect(screen.queryByRole('link', { name: /Service 5/ })).toBeNull();

        const previous = screen.getByRole('button', { name: 'Previous service page' });
        const next = screen.getByRole('button', { name: 'Next service page' });
        expect(previous.hasAttribute('disabled')).toBe(true);
        expect(container.querySelector('.service-pagination > span')?.textContent?.replace(/\s/g, '')).toBe('1/2');
        fireEvent.click(next);

        expect(container.querySelectorAll('.service-card')).toHaveLength(1);
        expect(container.querySelector('.service-grid-next')).toBeTruthy();
        expect(screen.getByRole('link', { name: /Service 5/ })).toBeTruthy();
        expect(container.querySelector('.service-pagination > span')?.textContent?.replace(/\s/g, '')).toBe('2/2');
        expect(next.hasAttribute('disabled')).toBe(true);
        expect(previous.hasAttribute('disabled')).toBe(false);
        fireEvent.click(previous);
        expect(container.querySelectorAll('.service-card')).toHaveLength(4);
        expect(container.querySelector('.service-grid-previous')).toBeTruthy();
    });

    it('hides pagination for four or fewer services and handles empty groups', () => {
        const { rerender } = render(<ServiceList services={services.slice(0, 4)} />);
        expect(screen.queryByRole('navigation', { name: 'Service pages' })).toBeNull();

        rerender(<ServiceList services={[]} />);
        expect(screen.getByText('Chưa có dịch vụ nào trong nhóm này.')).toBeTruthy();
        expect(screen.queryByRole('navigation', { name: 'Service pages' })).toBeNull();
    });

    it('renders the mail icon with the red service color', () => {
        const { container } = render(<ServiceList services={[{
            name: 'Stalwart OSS',
            description: 'Self-hosted mail server',
            color: 'red',
            icon: 'mail',
            logo: null,
        }]} />);

        expect(container.querySelector('.service-icon.icon-red svg[data-icon="mail"]')).toBeTruthy();
    });
});

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import Services from '../../../src/components/services/Services';
import type { ServiceGroup } from '../../../src/config/site';

afterEach(cleanup);

const groups: ServiceGroup[] = [
    { id: 'site', label: 'My services', services: [{ name: 'Cloud', description: 'Files', color: 'blue', icon: 'cloud', url: 'https://example.com', logo: '/logo.png' }] },
    { id: 'team', label: 'Team workspace', services: [] },
];

describe('Services', () => {
    it('renders safe external links and a fallback for broken logos', () => {
        const { container } = render(<Services groups={groups} />);
        const link = screen.getByRole('link', { name: /Cloud/ });
        expect(link.getAttribute('href')).toBe('https://example.com');
        expect(link.getAttribute('target')).toBe('_blank');
        expect(link.getAttribute('rel')).toBe('noopener noreferrer');
        expect(container.querySelector('.service-icon img')?.getAttribute('src')).toBe('/logo.png');
        fireEvent.error(container.querySelector('.service-icon img')!);
        expect(container.querySelector('.service-icon .lucide-cloud')).toBeTruthy();
    });

    it('uses the service origin favicon when no logo is configured', () => {
        const autoGroups: ServiceGroup[] = [
            { id: 'site', label: 'My services', services: [{ name: 'App', description: 'Example', color: 'blue', icon: 'cloud', url: 'https://example.com/some/path' }] },
        ];
        const { container } = render(<Services groups={autoGroups} />);
        const image = container.querySelector('.service-icon img');
        expect(image?.getAttribute('src')).toBe('https://example.com/favicon.ico');
        fireEvent.error(image!);
        expect(container.querySelector('.service-icon .lucide-cloud')).toBeTruthy();
    });

    it('renders a service with redirect disabled as a non-clickable card', () => {
        const nonRedirectGroups: ServiceGroup[] = [
            { id: 'site', label: 'My services', services: [{ name: 'Private service', description: 'No redirect', color: 'blue', icon: 'cloud', url: 'https://example.com', redirect: false }] },
        ];
        const { container } = render(<Services groups={nonRedirectGroups} />);
        expect(screen.queryByRole('link', { name: /Private service/ })).toBeNull();
        expect(container.querySelector('.service-disabled')).toBeTruthy();
        expect(container.querySelector('.service-arrow')).toBeNull();
    });

    it('resolves a bundled local icon configured by asset filename', () => {
        const localGroups: ServiceGroup[] = [
            { id: 'site', label: 'My services', services: [{ name: 'Gunny Taskbar', description: 'Health check', color: 'peach', icon: 'check', url: 'https://example.com', logo: 'asset:gunny-taskbar.ico' }] },
        ];
        const { container } = render(<Services groups={localGroups} />);
        expect(container.querySelector('.service-icon img')?.getAttribute('src')).toContain('gunny-taskbar.ico');
    });

    it('uses the Linux icon instead of a favicon when logo is null', () => {
        const linuxGroups: ServiceGroup[] = [
            { id: 'site', label: 'My services', services: [{ name: 'Cockpit', description: 'Linux', color: 'blue', icon: 'linux', logo: null, url: 'https://example.com' }] },
        ];
        const { container } = render(<Services groups={linuxGroups} />);
        expect(container.querySelector('.service-icon img')).toBeNull();
        expect(container.querySelector('.service-icon svg[data-icon="linux"]')).toBeTruthy();
    });

    it('supports mouse and keyboard tab navigation and empty groups', () => {
        render(<Services groups={groups} />);
        const first = screen.getByRole('tab', { name: /My services/ });
        const second = screen.getByRole('tab', { name: /Team workspace/ });
        expect(first.getAttribute('aria-selected')).toBe('true');
        fireEvent.keyDown(first, { key: 'ArrowRight' });
        expect(second.getAttribute('aria-selected')).toBe('true');
        expect(document.activeElement).toBe(second);
        expect(screen.getByText('Chưa có dịch vụ nào trong nhóm này.')).toBeTruthy();
        fireEvent.click(first);
        expect(first.getAttribute('aria-selected')).toBe('true');
    });
});
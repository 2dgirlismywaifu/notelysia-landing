import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import Avatar from '../../../src/components/avatar/Avatar';

afterEach(cleanup);

describe('Avatar', () => {
    it('shows a fallback without an email hash', () => {
        render(<Avatar hash="" />);
        expect(screen.getByLabelText('Ảnh đại diện mặc định')).toBeTruthy();
        expect(screen.queryByRole('img')).toBeNull();
    });

    it('uses the hash and falls back when Gravatar fails', () => {
        render(<Avatar hash="abc123" />);
        const image = screen.getByRole('img', { name: 'Ảnh đại diện Gravatar' });
        expect(image.getAttribute('src')).toBe('https://www.gravatar.com/avatar/abc123?s=320&d=404');
        fireEvent.error(image);
        expect(screen.getByLabelText('Ảnh đại diện mặc định')).toBeTruthy();
    });

    it('uses the same Gravatar as a decorative compact logo', () => {
        const { container } = render(<Avatar hash="abc123" compact />);
        const image = container.querySelector('img');
        expect(image?.getAttribute('src')).toBe('https://www.gravatar.com/avatar/abc123?s=240&d=404');
        expect(image?.getAttribute('alt')).toBe('');
        fireEvent.error(image!);
        expect(container.querySelector('.avatar-fallback .lucide-user-round')).toBeTruthy();
    });
});
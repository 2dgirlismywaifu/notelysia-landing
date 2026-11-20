import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import Background, { sortBackgrounds } from '../../../src/components/background/Background';

afterEach(cleanup);

describe('Background', () => {
    it('sorts matching images numerically and ignores other files', () => {
        expect(sortBackgrounds({ '/background-10.png': 'ten', '/background-2.webp': 'two', '/background-1.jpg': 'one', '/other.jpg': 'other' })).toEqual(['one', 'two', 'ten']);
    });

    it('has a fallback and no controls with fewer than two images', () => {
        const { rerender, container } = render(<Background images={[]} />);
        expect(container.querySelector('.background img')).toBeNull();
        expect(screen.queryByRole('button')).toBeNull();
        rerender(<Background images={['one.jpg']} />);
        expect(container.querySelector('.background img')?.getAttribute('src')).toBe('one.jpg');
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('wraps in both directions and falls back when an image fails', () => {
        const { container } = render(<Background images={['one.jpg', 'two.jpg']} />);
        fireEvent.click(screen.getByRole('button', { name: 'Ảnh nền trước' }));
        expect(container.querySelector('.background img')?.getAttribute('src')).toBe('two.jpg');
        fireEvent.click(screen.getByRole('button', { name: 'Ảnh nền tiếp theo' }));
        const image = container.querySelector('.background img');
        expect(image?.getAttribute('src')).toBe('one.jpg');
        fireEvent.error(image!);
        expect(container.querySelector('.background img')).toBeNull();
    });
});
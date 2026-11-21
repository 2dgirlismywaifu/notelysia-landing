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
        fireEvent.load(container.querySelector('.background img')!);
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('keeps the previous image until the next image loads and fades in', () => {
        const { container } = render(<Background images={['one.jpg', 'two.jpg']} />);
        const mobileControls = screen.getByRole('group', { name: 'Điều khiển ảnh nền' });
        expect(mobileControls.textContent).toContain('01 / 02');
        fireEvent.click(screen.getByRole('button', { name: 'Ảnh nền tiếp theo trên điện thoại' }));
        expect(mobileControls.textContent).toContain('02 / 02');
        const pending = container.querySelector<HTMLImageElement>('.background-image-pending')!;
        expect(pending.getAttribute('src')).toBe('two.jpg');
        expect(container.querySelector('.background img')?.getAttribute('src')).toBe('one.jpg');
        fireEvent.load(pending);
        expect(container.querySelectorAll('.background img')).toHaveLength(2);
        expect(container.querySelector('.background-image-enter')?.getAttribute('src')).toBe('two.jpg');
        fireEvent.animationEnd(container.querySelector('.background-image-enter')!);
        expect(container.querySelectorAll('.background img')).toHaveLength(1);
        expect(container.querySelector('.background img')?.getAttribute('src')).toBe('two.jpg');
    });

    it('handles rapid navigation and falls back when an image fails', () => {
        const { container } = render(<Background images={['one.jpg', 'two.jpg', 'three.jpg']} />);
        fireEvent.click(screen.getByRole('button', { name: 'Ảnh nền tiếp theo' }));
        fireEvent.click(screen.getByRole('button', { name: 'Ảnh nền tiếp theo' }));
        expect(container.querySelectorAll('.background img')).toHaveLength(2);
        expect(container.querySelector('.background-image-pending')?.getAttribute('src')).toBe('three.jpg');
        fireEvent.error(container.querySelector('.background-image-pending')!);
        expect(container.querySelector('.background img')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: 'Ảnh nền tiếp theo' }));
        const pending = container.querySelector('.background-image-pending')!;
        expect(pending.getAttribute('src')).toBe('one.jpg');
        fireEvent.load(pending);
        fireEvent.click(screen.getByRole('button', { name: 'Ảnh nền trước' }));
        expect(container.querySelector('.background img')).toBeNull();
    });

    it('can return to the previous image while a fade is in progress', () => {
        const { container } = render(<Background images={['one.jpg', 'two.jpg']} />);
        fireEvent.click(screen.getByRole('button', { name: 'Ảnh nền tiếp theo' }));
        fireEvent.load(container.querySelector('.background-image-pending')!);
        fireEvent.click(screen.getByRole('button', { name: 'Ảnh nền trước' }));
        expect(container.querySelectorAll('.background img')).toHaveLength(2);
        expect(container.querySelector('.background-image-pending')?.getAttribute('src')).toBe('one.jpg');
        fireEvent.load(container.querySelector('.background-image-pending')!);
        fireEvent.animationEnd(container.querySelector('.background-image-enter')!);
        expect(container.querySelector('.background img')?.getAttribute('src')).toBe('one.jpg');
    });
});
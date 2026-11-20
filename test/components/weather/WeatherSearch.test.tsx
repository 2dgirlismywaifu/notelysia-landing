import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Weather from '../../../src/components/weather/Weather';

const fallback = { latitude: 10, longitude: 106, name: 'Dự phòng' };
const hanoi = { latitude: 21.02, longitude: 105.84, name: 'Hà Nội', admin1: 'Hanoi', country: 'Việt Nam' };
const danang = { latitude: 16.07, longitude: 108.22, name: 'Đà Nẵng', country: 'Việt Nam' };
const storageKey = 'weather-location';
const originalGeolocation = Object.getOwnPropertyDescriptor(navigator, 'geolocation');

function geo(getCurrentPosition?: Geolocation['getCurrentPosition']) {
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: getCurrentPosition ? { getCurrentPosition } : undefined });
}

function response(data: unknown, ok = true): Response {
    return { ok, json: async () => data } as Response;
}

const weather = (temperature = 24) => response({ current: { temperature_2m: temperature, weather_code: 0, is_day: 1 } });
const position = { coords: { latitude: 11, longitude: 107 } } as GeolocationPosition;

function openSearch() {
    fireEvent.click(screen.getByRole('button', { name: 'Tìm địa điểm' }));
    return screen.getByRole('combobox', { name: 'Tìm địa điểm' });
}

async function advance(ms = 300) {
    await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
}

describe('Weather location search', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        const values = new Map<string, string>();
        vi.stubGlobal('localStorage', {
            getItem: vi.fn((key: string) => values.get(key) ?? null),
            setItem: vi.fn((key: string, value: string) => { values.set(key, value); }),
            removeItem: vi.fn((key: string) => { values.delete(key); }),
            clear: vi.fn(() => values.clear()),
        });
        geo();
        vi.stubGlobal('fetch', vi.fn((url: string) => Promise.resolve(
            url.includes('geocoding-api') ? response({ results: [hanoi, danang] }) : weather(),
        )));
    });

    afterEach(() => {
        cleanup();
        vi.useRealTimers();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        if (originalGeolocation) Object.defineProperty(navigator, 'geolocation', originalGeolocation);
        else Reflect.deleteProperty(navigator, 'geolocation');
    });

    it('debounces trimmed search, selects a suggestion and persists its weather location', async () => {
        render(<Weather fallbackLocation={fallback} />);
        await act(async () => {});
        const input = openSearch();
        expect(input.getAttribute('aria-expanded')).toBe('true');
        expect(document.getElementById(input.getAttribute('aria-controls')!)?.getAttribute('role')).toBe('listbox');
        fireEvent.change(input, { target: { value: '  H ' } });
        await advance(400);
        expect(fetch).toHaveBeenCalledTimes(1);
        fireEvent.change(input, { target: { value: '  Ha  ' } });
        expect(screen.getByText('Đang tìm địa điểm…')).toBeTruthy();
        await advance(299);
        expect(fetch).toHaveBeenCalledTimes(1);
        await advance(1);
        const searchCall = vi.mocked(fetch).mock.calls[1];
        const url = new URL(searchCall[0] as string);
        expect(url.origin + url.pathname).toBe('https://geocoding-api.open-meteo.com/v1/search');
        expect(Object.fromEntries(url.searchParams)).toEqual({ name: 'Ha', count: '5', language: 'vi', format: 'json' });
        expect(searchCall[1]?.credentials).toBe('omit');
        fireEvent.click(screen.getByRole('option', { name: 'Hà Nội, Hanoi, Việt Nam' }));
        await act(async () => {});
        expect(screen.getByText('Hà Nội')).toBeTruthy();
        expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual({ latitude: 21.02, longitude: 105.84, name: 'Hà Nội' });
        const forecast = new URL(vi.mocked(fetch).mock.calls[2][0] as string);
        expect(forecast.searchParams.get('latitude')).toBe('21.02');
        expect(forecast.searchParams.get('longitude')).toBe('105.84');
        expect(screen.queryByRole('combobox')).toBeNull();
    });

    it('restores a valid saved location without geolocation and retries that location', async () => {
        localStorage.setItem(storageKey, JSON.stringify(hanoi));
        const getPosition = vi.fn();
        geo(getPosition);
        vi.mocked(fetch).mockResolvedValueOnce(response({}, false)).mockResolvedValueOnce(weather());
        render(<Weather fallbackLocation={fallback} />);
        await act(async () => {});
        fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
        await act(async () => {});
        expect(screen.getByText('Hà Nội')).toBeTruthy();
        expect(getPosition).not.toHaveBeenCalled();
        expect(new URL(vi.mocked(fetch).mock.calls[1][0] as string).searchParams.get('latitude')).toBe('21.02');
    });

    it('retains a selected location after the widget is remounted', async () => {
        const getPosition = vi.fn<Geolocation['getCurrentPosition']>();
        geo(getPosition);
        const first = render(<Weather />);
        const input = openSearch();
        fireEvent.change(input, { target: { value: 'Ha' } });
        await advance();
        fireEvent.click(screen.getByRole('option', { name: /Hà Nội/ }));
        await act(async () => {});
        first.unmount();
        render(<Weather />);
        await act(async () => {});
        expect(screen.getByText('Hà Nội')).toBeTruthy();
        expect(getPosition).toHaveBeenCalledTimes(1);
        expect(new URL(vi.mocked(fetch).mock.calls[2][0] as string).searchParams.get('longitude')).toBe('105.84');
    });

    it.each(['not json', JSON.stringify({ ...hanoi, latitude: 91 }), JSON.stringify({ ...hanoi, longitude: '105' }), JSON.stringify({ ...hanoi, name: ' ' })])(
        'ignores invalid stored values: %s', async (saved) => {
            localStorage.setItem(storageKey, saved);
            const getPosition = vi.fn((success: PositionCallback) => success(position));
            geo(getPosition);
            render(<Weather />);
            await act(async () => {});
            expect(getPosition).toHaveBeenCalledTimes(1);
            expect(screen.getByText('Vị trí hiện tại')).toBeTruthy();
        },
    );

    it('uses browser location, clears preference and falls back when permission is denied', async () => {
        localStorage.setItem(storageKey, JSON.stringify(hanoi));
        const getPosition = vi.fn<Geolocation['getCurrentPosition']>((_success, error) => error?.({ code: 1 } as GeolocationPositionError));
        geo(getPosition);
        render(<Weather fallbackLocation={fallback} />);
        await act(async () => {});
        openSearch();
        fireEvent.click(screen.getByRole('button', { name: 'Dùng vị trí hiện tại' }));
        await act(async () => {});
        expect(localStorage.getItem(storageKey)).toBeNull();
        expect(getPosition).toHaveBeenCalledTimes(1);
        expect(screen.getByText('Dự phòng')).toBeTruthy();
    });

    it('switches back to a successful browser location', async () => {
        localStorage.setItem(storageKey, JSON.stringify(hanoi));
        geo(vi.fn((success) => success(position)));
        render(<Weather />);
        await act(async () => {});
        openSearch();
        fireEvent.click(screen.getByRole('button', { name: 'Dùng vị trí hiện tại' }));
        await act(async () => {});
        expect(screen.getByText('Vị trí hiện tại')).toBeTruthy();
        expect(localStorage.getItem(storageKey)).toBeNull();
        const url = new URL(vi.mocked(fetch).mock.calls[1][0] as string);
        expect(url.searchParams.get('latitude')).toBe('11');
        expect(url.searchParams.get('longitude')).toBe('107');
    });

    it('handles storage access failures without breaking location selection', async () => {
        vi.mocked(localStorage.getItem).mockImplementation(() => { throw new Error('blocked'); });
        vi.mocked(localStorage.setItem).mockImplementation(() => { throw new Error('blocked'); });
        render(<Weather />);
        const input = openSearch();
        fireEvent.change(input, { target: { value: 'Ha' } });
        await advance();
        fireEvent.click(screen.getByRole('option', { name: /Hà Nội/ }));
        await act(async () => {});
        expect(screen.getByText('Hà Nội')).toBeTruthy();
    });

    it('announces empty and failed search results', async () => {
        vi.mocked(fetch).mockResolvedValueOnce(response({})).mockRejectedValueOnce(new Error('offline'));
        render(<Weather />);
        const input = openSearch();
        fireEvent.change(input, { target: { value: 'zz' } });
        await advance();
        expect(screen.getByText('Không tìm thấy địa điểm.')).toBeTruthy();
        fireEvent.change(input, { target: { value: 'zzz' } });
        await advance();
        expect(screen.getByText(/Không thể tìm địa điểm/)).toBeTruthy();
    });

    it('supports arrow navigation, enter selection and escape', async () => {
        render(<Weather />);
        const input = openSearch();
        fireEvent.change(input, { target: { value: 'Ha' } });
        await advance();
        fireEvent.keyDown(input, { key: 'ArrowUp' });
        const second = screen.getByRole('option', { name: 'Đà Nẵng, Việt Nam' });
        expect(input.getAttribute('aria-activedescendant')).toBe(second.id);
        expect(second.getAttribute('aria-selected')).toBe('true');
        fireEvent.keyDown(input, { key: 'ArrowDown' });
        expect(input.getAttribute('aria-activedescendant')).toBe(screen.getByRole('option', { name: /Hà Nội/ }).id);
        fireEvent.keyDown(input, { key: 'Enter' });
        await act(async () => {});
        expect(screen.getByText('Hà Nội')).toBeTruthy();
        const reopened = openSearch();
        fireEvent.keyDown(reopened, { key: 'Escape' });
        expect(screen.queryByRole('combobox')).toBeNull();
        expect(screen.getByRole('button', { name: 'Tìm địa điểm' }).getAttribute('aria-expanded')).toBe('false');
        expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Tìm địa điểm' }));
    });

    it('dismisses the search on an outside pointer action', () => {
        render(<Weather />);
        const input = openSearch();
        expect(document.activeElement).toBe(input);
        fireEvent.pointerDown(document.body);
        expect(screen.queryByRole('combobox')).toBeNull();
        expect(screen.getByRole('button', { name: 'Tìm địa điểm' }).getAttribute('aria-expanded')).toBe('false');
    });

    it('cancels the debounce when unmounted before a search begins', async () => {
        const { unmount } = render(<Weather />);
        const input = openSearch();
        fireEvent.change(input, { target: { value: 'Ha' } });
        unmount();
        await advance(300);
        expect(fetch).not.toHaveBeenCalled();
    });

    it('aborts and ignores stale searches even when fetch ignores abort, including on unmount', async () => {
        let resolveOld: ((value: Response) => void) | undefined;
        let resolveLast: ((value: Response) => void) | undefined;
        vi.mocked(fetch).mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }))
            .mockResolvedValueOnce(response({ results: [danang] }))
            .mockImplementationOnce(() => new Promise((resolve) => { resolveLast = resolve; }));
        const { unmount } = render(<Weather />);
        const input = openSearch();
        fireEvent.change(input, { target: { value: 'Ha' } });
        await advance();
        const oldSignal = vi.mocked(fetch).mock.calls[0][1]?.signal;
        fireEvent.change(input, { target: { value: 'Da' } });
        expect(oldSignal?.aborted).toBe(true);
        await advance();
        await act(async () => { resolveOld?.(response({ results: [hanoi] })); });
        expect(screen.getByRole('option', { name: /Đà Nẵng/ })).toBeTruthy();
        expect(screen.queryByRole('option', { name: /Hà Nội/ })).toBeNull();
        fireEvent.change(input, { target: { value: 'Hue' } });
        await advance();
        const lastSignal = vi.mocked(fetch).mock.calls[2][1]?.signal;
        unmount();
        expect(lastSignal?.aborted).toBe(true);
        await act(async () => { resolveLast?.(response({ results: [hanoi] })); });
        expect(screen.queryByRole('option')).toBeNull();
    });

    it('ignores a pending geolocation callback and stale weather after choosing a place', async () => {
        let success: PositionCallback | undefined;
        let resolveWeather: ((value: Response) => void) | undefined;
        geo(vi.fn((callback) => { success = callback; }));
        vi.mocked(fetch).mockImplementation((url) => {
            if (String(url).includes('geocoding-api')) return Promise.resolve(response({ results: [hanoi, danang] }));
            if (String(url).includes('21.02')) return new Promise((resolve) => { resolveWeather = resolve; });
            return Promise.resolve(weather(17));
        });
        render(<Weather />);
        let input = openSearch();
        fireEvent.change(input, { target: { value: 'Ha' } });
        await advance();
        fireEvent.click(screen.getByRole('option', { name: /Hà Nội/ }));
        await act(async () => {});
        const oldSignal = vi.mocked(fetch).mock.calls[1][1]?.signal;
        act(() => success?.(position));
        expect(fetch).toHaveBeenCalledTimes(2);
        input = openSearch();
        fireEvent.change(input, { target: { value: 'Da' } });
        await advance();
        fireEvent.click(screen.getByRole('option', { name: /Đà Nẵng/ }));
        await act(async () => {});
        expect(oldSignal?.aborted).toBe(true);
        await act(async () => { resolveWeather?.(weather(30)); });
        expect(screen.getByText('Đà Nẵng')).toBeTruthy();
        expect(screen.getByText('17°C')).toBeTruthy();
        expect(screen.queryByText('30°C')).toBeNull();
    });
});
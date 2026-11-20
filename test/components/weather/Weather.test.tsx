import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Weather from '../../../src/components/weather/Weather';

const fallback = { latitude: 10.77, longitude: 106.7, name: 'TP. Hồ Chí Minh' };

function weatherResponse(temperature = 27.4, code = 0, isDay = 1): Response {
    return {
        ok: true,
        json: async () => ({ current: { temperature_2m: temperature, weather_code: code, is_day: isDay } }),
    } as Response;
}

function position(latitude = 21.03, longitude = 105.85): GeolocationPosition {
    return { coords: { latitude, longitude } } as GeolocationPosition;
}

describe('Weather', () => {
    const originalGeolocation = Object.getOwnPropertyDescriptor(navigator, 'geolocation');

    function setGeolocation(getCurrentPosition?: Geolocation['getCurrentPosition']) {
        Object.defineProperty(navigator, 'geolocation', {
            configurable: true,
            value: getCurrentPosition ? { getCurrentPosition } : undefined,
        });
    }

    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(weatherResponse()));
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
        if (originalGeolocation) {
            Object.defineProperty(navigator, 'geolocation', originalGeolocation);
        } else {
            Reflect.deleteProperty(navigator, 'geolocation');
        }
    });

    it('loads current weather for the browser position', async () => {
        let succeed: PositionCallback | undefined;
        setGeolocation(vi.fn((success: PositionCallback) => { succeed = success; }));
        render(<Weather fallbackLocation={fallback} />);

        expect(screen.getByText('Đang tải thời tiết…')).toBeTruthy();
        act(() => succeed?.(position()));

        expect(await screen.findByText('27°C')).toBeTruthy();
        expect(screen.getByText('Vị trí hiện tại')).toBeTruthy();
        expect(screen.getByText('Trời quang')).toBeTruthy();
        expect(document.querySelector('.weather-icon.lucide-sun')).toBeTruthy();
        const url = new URL(vi.mocked(fetch).mock.calls[0][0] as string);
        expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
        expect(url.searchParams.get('latitude')).toBe('21.03');
        expect(url.searchParams.get('longitude')).toBe('105.85');
        expect(url.searchParams.get('current')).toBe('temperature_2m,weather_code,is_day');
        expect(url.searchParams.get('temperature_unit')).toBe('celsius');
    });

    it('explains how to provide a position when permission is denied and no fallback exists', async () => {
        setGeolocation(vi.fn((_success, error) => error?.({ code: 1 } as GeolocationPositionError)));
        render(<Weather />);

        expect(await screen.findByText(/cho phép truy cập vị trí hoặc cấu hình địa điểm dự phòng/i)).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Thử lại' })).toBeTruthy();
        expect(fetch).not.toHaveBeenCalled();
    });

    it('can retry after geolocation permission is granted', async () => {
        const getCurrentPosition = vi.fn<Geolocation['getCurrentPosition']>()
            .mockImplementationOnce((_success, error) => error?.({ code: 1 } as GeolocationPositionError))
            .mockImplementationOnce((success) => success(position()));
        setGeolocation(getCurrentPosition);
        render(<Weather />);

        fireEvent.click(await screen.findByRole('button', { name: 'Thử lại' }));
        expect(await screen.findByText('Vị trí hiện tại')).toBeTruthy();
        expect(getCurrentPosition).toHaveBeenCalledTimes(2);
        expect(getCurrentPosition.mock.calls[0][2]?.timeout).toBe(10000);
    });

    it('shows the no-position guidance when geolocation is unavailable', async () => {
        setGeolocation();
        render(<Weather />);
        expect(await screen.findByText(/không có vị trí/i)).toBeTruthy();
        expect(fetch).not.toHaveBeenCalled();
    });

    it.each([2, 3])('uses the named fallback after geolocation error %s', async (code) => {
        setGeolocation(vi.fn((_success, error) => error?.({ code } as GeolocationPositionError)));
        vi.mocked(fetch).mockResolvedValue(weatherResponse(21.6, 0, 0));
        render(<Weather fallbackLocation={fallback} />);

        expect(await screen.findByText('TP. Hồ Chí Minh')).toBeTruthy();
        expect(screen.getByText('22°C')).toBeTruthy();
        expect(document.querySelector('.weather-icon.lucide-moon')).toBeTruthy();
        const url = new URL(vi.mocked(fetch).mock.calls[0][0] as string);
        expect(url.searchParams.get('latitude')).toBe('10.77');
        expect(url.searchParams.get('longitude')).toBe('106.7');
    });

    it('uses the fallback when permission is denied or geolocation is unavailable', async () => {
        setGeolocation(vi.fn((_success, error) => error?.({ code: 1 } as GeolocationPositionError)));
        const { unmount } = render(<Weather fallbackLocation={fallback} />);
        expect(await screen.findByText(fallback.name)).toBeTruthy();
        unmount();

        setGeolocation();
        render(<Weather fallbackLocation={fallback} />);
        expect(await screen.findByText(fallback.name)).toBeTruthy();
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it.each([
        [0, 1, 'Trời quang', 'sun'],
        [0, 0, 'Trời quang', 'moon'],
        [1, 1, 'Ít mây', 'cloud-sun'],
        [2, 0, 'Ít mây', 'cloud-moon'],
        [3, 1, 'Nhiều mây', 'cloud'],
        [45, 1, 'Sương mù', 'cloud-fog'],
        [51, 1, 'Mưa phùn', 'cloud-drizzle'],
        [61, 1, 'Có mưa', 'cloud-rain'],
        [71, 1, 'Có tuyết', 'cloud-snow'],
        [95, 1, 'Có giông', 'cloud-lightning'],
        [999, 1, 'Thời tiết không xác định', 'thermometer'],
    ])('renders the Lucide icon for weather code %s (is_day %s)', async (code, isDay, label, icon) => {
        setGeolocation();
        vi.mocked(fetch).mockResolvedValue(weatherResponse(21, code, isDay));
        render(<Weather fallbackLocation={fallback} />);

        expect(await screen.findByText(label)).toBeTruthy();
        expect(document.querySelector(`.weather-icon.lucide-${icon}`)?.getAttribute('aria-hidden')).toBe('true');
    });

    it('shows a network error and retries the complete flow', async () => {
        setGeolocation(vi.fn((success) => success(position())));
        vi.mocked(fetch).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(weatherResponse(19, 61));
        render(<Weather />);

        expect(await screen.findByText(/không thể tải thời tiết/i)).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
        expect(await screen.findByText('19°C')).toBeTruthy();
        expect(screen.getByText('Có mưa')).toBeTruthy();
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('treats a failed HTTP response or malformed data as an error', async () => {
        setGeolocation();
        vi.mocked(fetch)
            .mockResolvedValueOnce({ ok: false } as Response)
            .mockResolvedValueOnce({ ok: true, json: async () => ({ current: {} }) } as Response);
        render(<Weather fallbackLocation={fallback} />);

        expect(await screen.findByText(/không thể tải thời tiết/i)).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
        expect(await screen.findByText(/không thể tải thời tiết/i)).toBeTruthy();
    });

    it('does not fetch when a geolocation callback arrives after unmount', () => {
        let succeed: PositionCallback | undefined;
        setGeolocation(vi.fn((success) => { succeed = success; }));
        const { unmount } = render(<Weather />);
        unmount();
        act(() => succeed?.(position()));
        expect(fetch).not.toHaveBeenCalled();
    });

    it('ignores a geolocation callback from an earlier attempt', async () => {
        const callbacks: PositionCallback[] = [];
        setGeolocation(vi.fn((success) => { callbacks.push(success); }));
        const { rerender } = render(<Weather fallbackLocation={fallback} />);
        rerender(<Weather fallbackLocation={{ ...fallback, name: 'Mới' }} />);

        act(() => callbacks[0](position()));
        expect(fetch).not.toHaveBeenCalled();
        act(() => callbacks[1](position()));
        expect(await screen.findByText('Vị trí hiện tại')).toBeTruthy();
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('aborts an in-flight request on unmount', async () => {
        setGeolocation(vi.fn((success) => success(position())));
        vi.mocked(fetch).mockImplementation(() => new Promise(() => { }));
        const { unmount } = render(<Weather />);
        await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
        const signal = vi.mocked(fetch).mock.calls[0][1]?.signal;
        expect(signal?.aborted).toBe(false);
        unmount();
        expect(signal?.aborted).toBe(true);
    });

    it('ignores stale requests after fallback props change', async () => {
        setGeolocation();
        let resolveOld: ((response: Response) => void) | undefined;
        vi.mocked(fetch)
            .mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }))
            .mockResolvedValueOnce(weatherResponse(12, 3));
        const { rerender } = render(<Weather fallbackLocation={fallback} />);
        rerender(<Weather fallbackLocation={{ latitude: 1, longitude: 2, name: 'Địa điểm mới' }} />);

        expect(await screen.findByText('Địa điểm mới')).toBeTruthy();
        await act(async () => { resolveOld?.(weatherResponse(30)); });
        expect(screen.getByText('12°C')).toBeTruthy();
        expect(screen.queryByText('30°C')).toBeNull();
    });
});
import { useEffect, useId, useRef, useState } from 'react';
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, LocateFixed, MapPin, Moon, Search, Sun, Thermometer } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Location = { latitude: number; longitude: number; name: string };
type WeatherData = { temperature: number; code: number; isDay: boolean; location: string };
type WeatherState =
    | { status: 'loading' }
    | { status: 'no-position' }
    | { status: 'error' }
    | { status: 'ready'; data: WeatherData };

type Suggestion = Location & { admin1?: string; country?: string };
type SearchState =
    | { status: 'idle' | 'loading' | 'error' }
    | { status: 'ready'; results: Suggestion[] };

const LOCATION_KEY = 'weather-location';

function validLocation(value: unknown): value is Location {
    if (!value || typeof value !== 'object') return false;
    const location = value as Record<string, unknown>;
    return typeof location.name === 'string' && location.name.trim().length > 0 &&
        typeof location.latitude === 'number' && Number.isFinite(location.latitude) && Math.abs(location.latitude) <= 90 &&
        typeof location.longitude === 'number' && Number.isFinite(location.longitude) && Math.abs(location.longitude) <= 180;
}

function readLocation(): Location | null {
    try {
        const saved = localStorage.getItem(LOCATION_KEY);
        const value: unknown = saved ? JSON.parse(saved) : null;
        return validLocation(value) ? { latitude: value.latitude, longitude: value.longitude, name: value.name.trim() } : null;
    } catch {
        return null;
    }
}

function saveLocation(location: Location | null) {
    try {
        if (location) localStorage.setItem(LOCATION_KEY, JSON.stringify(location));
        else localStorage.removeItem(LOCATION_KEY);
    } catch {
        // Storage can be unavailable or blocked; the choice still works for this session.
    }
}

function describeWeather(code: number, isDay: boolean): { icon: LucideIcon; label: string } {
    if (code === 0) return { icon: isDay ? Sun : Moon, label: 'Trời quang' };
    if (code === 1 || code === 2) return { icon: isDay ? CloudSun : CloudMoon, label: 'Ít mây' };
    if (code === 3) return { icon: Cloud, label: 'Nhiều mây' };
    if (code === 45 || code === 48) return { icon: CloudFog, label: 'Sương mù' };
    if ([51, 53, 55, 56, 57].includes(code)) return { icon: CloudDrizzle, label: 'Mưa phùn' };
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { icon: CloudRain, label: 'Có mưa' };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: CloudSnow, label: 'Có tuyết' };
    if ([95, 96, 99].includes(code)) return { icon: CloudLightning, label: 'Có giông' };
    return { icon: Thermometer, label: 'Thời tiết không xác định' };
}

export default function Weather(props: { fallbackLocation?: Location }) {
    const [state, setState] = useState<WeatherState>({ status: 'loading' });
    const [attempt, setAttempt] = useState(0);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(readLocation);
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [search, setSearch] = useState<SearchState>({ status: 'idle' });
    const [activeIndex, setActiveIndex] = useState(-1);
    const listId = useId();
    const widgetRef = useRef<HTMLElement>(null);
    const searchToggle = useRef<HTMLButtonElement>(null);
    const weatherGeneration = useRef(0);
    const weatherController = useRef<AbortController | null>(null);
    const searchGeneration = useRef(0);
    const searchController = useRef<AbortController | null>(null);
    const latitude = props.fallbackLocation?.latitude;
    const longitude = props.fallbackLocation?.longitude;
    const name = props.fallbackLocation?.name;

    useEffect(() => {
        let active = true;
        let positionSettled = false;
        const controller = new AbortController();
        weatherController.current = controller;
        const generation = ++weatherGeneration.current;
        const isCurrent = () => active && generation === weatherGeneration.current;
        setState({ status: 'loading' });

        async function loadWeather(lat: number, lon: number, location: string) {
            try {
                const params = new URLSearchParams({
                    latitude: String(lat),
                    longitude: String(lon),
                    current: 'temperature_2m,weather_code,is_day',
                    temperature_unit: 'celsius',
                });
                const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
                    signal: controller.signal,
                    credentials: 'omit',
                });
                if (!response.ok) throw new Error('Weather request failed');
                const json: unknown = await response.json();
                if (!json || typeof json !== 'object' || !('current' in json)) throw new Error('Invalid weather response');
                const current = json.current;
                if (!current || typeof current !== 'object' ||
                    !('temperature_2m' in current) || typeof current.temperature_2m !== 'number' || !Number.isFinite(current.temperature_2m) ||
                    !('weather_code' in current) || typeof current.weather_code !== 'number' || !Number.isFinite(current.weather_code) ||
                    !('is_day' in current) || (current.is_day !== 0 && current.is_day !== 1)) {
                    throw new Error('Invalid weather response');
                }
                if (isCurrent()) {
                    setState({
                        status: 'ready',
                        data: { temperature: current.temperature_2m, code: current.weather_code, isDay: current.is_day === 1, location },
                    });
                }
            } catch {
                if (isCurrent() && !controller.signal.aborted) setState({ status: 'error' });
            }
        }

        function useFallback() {
            if (!isCurrent() || positionSettled) return;
            positionSettled = true;
            if (latitude !== undefined && longitude !== undefined && name !== undefined) {
                void loadWeather(latitude, longitude, name);
            } else {
                setState({ status: 'no-position' });
            }
        }

        if (selectedLocation) {
            positionSettled = true;
            void loadWeather(selectedLocation.latitude, selectedLocation.longitude, selectedLocation.name);
        } else if (!navigator.geolocation) {
            useFallback();
        } else {
            try {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        if (!isCurrent() || positionSettled) return;
                        positionSettled = true;
                        void loadWeather(position.coords.latitude, position.coords.longitude, 'Vị trí hiện tại');
                    },
                    useFallback,
                    { timeout: 10000, maximumAge: 300000 },
                );
            } catch {
                useFallback();
            }
        }

        return () => {
            active = false;
            controller.abort();
        };
    }, [attempt, latitude, longitude, name, selectedLocation]);

    useEffect(() => {
        const term = query.trim();
        if (!searchOpen || term.length < 2) {
            setSearch({ status: 'idle' });
            return;
        }

        let active = true;
        const generation = searchGeneration.current;
        const controller = new AbortController();
        searchController.current = controller;
        setSearch({ status: 'loading' });
        const timer = window.setTimeout(async () => {
            try {
                const params = new URLSearchParams({ name: term, count: '5', language: 'vi', format: 'json' });
                const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, { signal: controller.signal, credentials: 'omit' });
                if (!response.ok) throw new Error('Search request failed');
                const json: unknown = await response.json();
                if (!json || typeof json !== 'object' || ('results' in json && !Array.isArray(json.results))) {
                    throw new Error('Invalid search response');
                }
                const results: unknown[] = 'results' in json ? json.results as unknown[] : [];
                const suggestions = results.filter(validLocation).map((result) => {
                    const item = result as Location & { admin1?: unknown; country?: unknown };
                    return {
                        latitude: item.latitude, longitude: item.longitude, name: item.name.trim(),
                        admin1: typeof item.admin1 === 'string' ? item.admin1.trim() : undefined,
                        country: typeof item.country === 'string' ? item.country.trim() : undefined,
                    };
                });
                if (active && generation === searchGeneration.current) setSearch({ status: 'ready', results: suggestions });
            } catch {
                if (active && generation === searchGeneration.current && !controller.signal.aborted) setSearch({ status: 'error' });
            }
        }, 300);

        return () => {
            active = false;
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [query, searchOpen]);

    useEffect(() => {
        if (!searchOpen) return;
        const dismiss = (event: PointerEvent) => {
            if (event.target instanceof Node && !widgetRef.current?.contains(event.target)) {
                searchGeneration.current += 1;
                searchController.current?.abort();
                setActiveIndex(-1);
                setSearchOpen(false);
                setQuery('');
            }
        };
        document.addEventListener('pointerdown', dismiss);
        return () => document.removeEventListener('pointerdown', dismiss);
    }, [searchOpen]);

    const cancelSearch = () => {
        searchGeneration.current += 1;
        searchController.current?.abort();
        setActiveIndex(-1);
    };

    const closeSearch = () => {
        cancelSearch();
        setSearchOpen(false);
        setQuery('');
        searchToggle.current?.focus();
    };

    const changeLocation = (location: Location | null) => {
        weatherGeneration.current += 1;
        weatherController.current?.abort();
        const choice = location && { latitude: location.latitude, longitude: location.longitude, name: location.name };
        saveLocation(choice);
        setSelectedLocation(choice);
        setAttempt((previous) => previous + 1);
        closeSearch();
    };

    const retry = () => setAttempt((previous) => previous + 1);

    return (
        <section ref={widgetRef} className="weather-widget" aria-label="Thời tiết">
            {state.status === 'loading' && <p className="weather-loading" role="status">Đang tải thời tiết…</p>}
            {state.status === 'no-position' && (
                <div className="weather-no-position" role="status">
                    <p>Không có vị trí. Hãy cho phép truy cập vị trí hoặc cấu hình địa điểm dự phòng.</p>
                    <button className="weather-retry" type="button" onClick={retry}>Thử lại</button>
                </div>
            )}
            {state.status === 'error' && (
                <div className="weather-error" role="status">
                    <p>Không thể tải thời tiết. Vui lòng kiểm tra kết nối và thử lại.</p>
                    <button className="weather-retry" type="button" onClick={retry}>Thử lại</button>
                </div>
            )}
            {state.status === 'ready' && (() => {
                const description = describeWeather(state.data.code, state.data.isDay);
                const WeatherIcon = description.icon;
                return (
                    <div className="weather-content">
                        <WeatherIcon className="weather-icon" size={24} strokeWidth={1.7} aria-hidden="true" />
                        <div className="weather-details">
                            <span className="weather-location">{state.data.location}</span>
                            <span className="weather-temperature">{Math.round(state.data.temperature)}°C</span>
                            <span className="weather-description">{description.label}</span>
                        </div>
                    </div>
                );
            })()}
            <button ref={searchToggle} className="weather-search-toggle" type="button" aria-expanded={searchOpen} aria-controls={searchOpen ? `${listId}-panel` : undefined}
                onClick={() => searchOpen ? closeSearch() : setSearchOpen(true)}>
                <MapPin size={13} aria-hidden="true" /> Tìm địa điểm
            </button>
            {searchOpen && (
                <div id={`${listId}-panel`} className="weather-search-panel">
                    <label htmlFor={`${listId}-input`}>Tìm địa điểm</label>
                    <div className="weather-search-field"><Search size={16} aria-hidden="true" /><input id={`${listId}-input`} className="weather-search-input" type="text" role="combobox"
                        aria-autocomplete="list" aria-expanded="true" aria-controls={listId}
                        aria-activedescendant={search.status === 'ready' && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
                        value={query} autoComplete="off" placeholder="Nhập tên thành phố..." autoFocus
                        onChange={(event) => { cancelSearch(); setQuery(event.target.value); }}
                        onKeyDown={(event) => {
                            if (event.key === 'Escape') { event.preventDefault(); closeSearch(); }
                            if (search.status !== 'ready' || search.results.length === 0) return;
                            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                                event.preventDefault();
                                setActiveIndex((index) => event.key === 'ArrowDown'
                                    ? (index + 1) % search.results.length
                                    : (index <= 0 ? search.results.length - 1 : index - 1));
                            } else if (event.key === 'Enter' && activeIndex >= 0) {
                                event.preventDefault();
                                changeLocation(search.results[activeIndex]);
                            }
                        }} /></div>
                    {search.status === 'idle' && <p className="weather-search-state" role="status">Nhập ít nhất 2 ký tự.</p>}
                    {search.status === 'loading' && <p className="weather-search-state" role="status">Đang tìm địa điểm…</p>}
                    {search.status === 'error' && <p className="weather-search-state" role="status">Không thể tìm địa điểm. Vui lòng kiểm tra kết nối.</p>}
                    {search.status === 'ready' && search.results.length === 0 && <p className="weather-search-state" role="status">Không tìm thấy địa điểm.</p>}
                    <div className="weather-search-results" id={listId} role="listbox" aria-label="Kết quả tìm địa điểm">
                        {search.status === 'ready' && search.results.map((result, index) => (
                            <button className="weather-search-option" id={`${listId}-${index}`} key={`${result.latitude}-${result.longitude}-${index}`}
                                type="button" role="option" aria-selected={index === activeIndex} onClick={() => changeLocation(result)}>
                                {[result.name, result.admin1, result.country].filter(Boolean).join(', ')}
                            </button>
                        ))}
                    </div>
                    <button className="weather-search-current" type="button" onClick={() => changeLocation(null)}><LocateFixed size={15} aria-hidden="true" /> Dùng vị trí hiện tại</button>
                </div>
            )}
        </section>
    );
}
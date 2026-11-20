import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Image } from 'lucide-react';

const modules = import.meta.glob<string>('../../assets/backgrounds/*', {
    eager: true, query: '?url', import: 'default',
});

export function sortBackgrounds(files: Record<string, string>): string[] {
    return Object.entries(files)
        .map(([path, url]) => ({ path, url, match: path.match(/\/background-(\d+)\.(?:jpe?g|png|webp)$/i) }))
        .filter((entry) => entry.match !== null)
        .sort((a, b) => Number(a.match![1]) - Number(b.match![1]) || a.path.localeCompare(b.path))
        .map(({ url }) => url);
}

const backgrounds = sortBackgrounds(modules);

const DEFAULT_EDGE = 'rgb(21, 25, 37)';

// Mirrors --ambient-shade in styles.css (flat layer, then top/bottom gradient alpha).
function shaded(channels: number[], gradientAlpha: number): string {
    const flat = [14, 17, 26];
    const tint = [13, 16, 25];
    return `rgb(${channels.map((value, i) => {
        const base = value * 0.8 + flat[i] * 0.2;
        return Math.round(base * (1 - gradientAlpha) + tint[i] * gradientAlpha);
    }).join(', ')})`;
}

function averageRows(context: CanvasRenderingContext2D, y: number, height: number, size: number): number[] {
    const { data } = context.getImageData(0, y, size, height);
    const total = [0, 0, 0];
    for (let i = 0; i < data.length; i += 4) for (let c = 0; c < 3; c++) total[c] += data[i + c];
    return total.map((sum) => sum / (data.length / 4));
}

function sampleEdges(image: HTMLImageElement): { top: string; bottom: string } | null {
    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;
    context.drawImage(image, 0, 0, size, size);
    return { top: shaded(averageRows(context, 0, 4, size), 0.48), bottom: shaded(averageRows(context, size - 4, 4, size), 0.78) };
}

export default function Background({ images = backgrounds }: { images?: string[] }) {
    const [index, setIndex] = useState(0);
    const [failed, setFailed] = useState<string[]>([]);
    const [edges, setEdges] = useState({ top: DEFAULT_EDGE, bottom: DEFAULT_EDGE });
    const current = images[index];

    useEffect(() => {
        if (!current) return;
        let cancelled = false;
        const probe = new window.Image();
        probe.onload = () => {
            if (cancelled) return;
            try {
                const sampled = sampleEdges(probe);
                if (sampled) setEdges(sampled);
            } catch { /* keep previous colors */ }
        };
        probe.src = current;
        return () => { cancelled = true; probe.onload = null; };
    }, [current]);

    useEffect(() => {
        const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
        document.documentElement.style.backgroundColor = edges.top;
        document.body.style.backgroundColor = edges.top;
        meta?.setAttribute('content', edges.top);
    }, [edges.top]);

    function move(direction: number) {
        setIndex((previous) => (previous + direction + images.length) % images.length);
    }

    return (
        <>
            <div className="background" aria-hidden="true">
                {current && !failed.includes(current) && (
                    <img key={current} src={current} alt="" onError={() => setFailed((previous) => [...previous, current])} />
                )}
            </div>
            <div className="background-shade" aria-hidden="true" />
            <div className="safe-edge safe-edge-top" style={{ backgroundColor: edges.top }} aria-hidden="true" />
            <div className="safe-edge safe-edge-bottom" style={{ backgroundColor: edges.bottom }} aria-hidden="true" />
            {images.length > 1 && (
                <>
                    <button className="background-arrow background-arrow-left" aria-label="Ảnh nền trước" onClick={() => move(-1)}><ChevronLeft size={20} /></button>
                    <button className="background-arrow background-arrow-right" aria-label="Ảnh nền tiếp theo" onClick={() => move(1)}><ChevronRight size={20} /></button>
                    <div className="background-mobile-controls" role="group" aria-label="Điều khiển ảnh nền">
                        <button aria-label="Ảnh nền trước trên điện thoại" onClick={() => move(-1)}><ChevronLeft size={18} /></button>
                        <span aria-live="polite">{String(index + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}</span>
                        <button aria-label="Ảnh nền tiếp theo trên điện thoại" onClick={() => move(1)}><ChevronRight size={18} /></button>
                    </div>
                </>
            )}
            <div className="background-info" aria-hidden="true"><Image size={14} /><span>{images.length ? `${String(index + 1).padStart(2, '0')} / ${String(images.length).padStart(2, '0')}` : 'YOUR LITTLE SPACE'}</span></div>
        </>
    );
}
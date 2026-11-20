import { useState } from 'react';
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

export default function Background({ images = backgrounds }: { images?: string[] }) {
    const [index, setIndex] = useState(0);
    const [failed, setFailed] = useState<string[]>([]);
    const current = images[index];

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
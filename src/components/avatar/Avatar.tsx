import { useState } from 'react';
import { UserRound } from 'lucide-react';

export function gravatarUrl(hash: string, size: number) {
    return `https://www.gravatar.com/avatar/${encodeURIComponent(hash)}?s=${size}&d=404`;
}

export default function Avatar({ hash = __GRAVATAR_HASH__, compact = false }: { hash?: string; compact?: boolean }) {
    const [failed, setFailed] = useState(false);
    return (
        <div className={`avatar-wrap${compact ? ' avatar-compact' : ''}`}>
            <div className="avatar-ring">
                {hash && !failed ? (
                    <img className="avatar" src={gravatarUrl(hash, compact ? 240 : 320)} alt={compact ? '' : 'Ảnh đại diện Gravatar'} onError={() => setFailed(true)} />
                ) : (
                    <div className="avatar avatar-fallback" aria-label={compact ? undefined : 'Ảnh đại diện mặc định'} aria-hidden={compact || undefined}><UserRound size={compact ? 16 : 48} strokeWidth={1.5} aria-hidden="true" /></div>
                )}
            </div>
            {!compact && <span className="avatar-status" title="Welcome" aria-hidden="true" />}
        </div>
    );
}
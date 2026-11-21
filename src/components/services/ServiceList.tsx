import { useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, CheckSquare, Cloud, FileText, Image, KeyRound, MessageCircle, Monitor, Play, Server, Shield } from 'lucide-react';
import { SiLinux } from 'react-icons/si';
import type { Service } from '../../config/site';

const PAGE_SIZE = 4;
const icons = { cloud: Cloud, photo: Image, play: Play, server: Server, message: MessageCircle, calendar: CalendarDays, file: FileText, check: CheckSquare, linux: SiLinux, shield: Shield, monitor: Monitor, key: KeyRound };
const localLogos = import.meta.glob<string>('../../assets/ico/*', {
    eager: true, query: '?url', import: 'default',
});

function ServiceCard({ service }: { service: Service }) {
    const [failedLogo, setFailedLogo] = useState<string | null>(null);
    const Icon = icons[service.icon];
    let logo = service.logo;
    if (logo?.startsWith('asset:')) {
        logo = localLogos[`../../assets/ico/${logo.slice('asset:'.length)}`];
    }
    if (logo === undefined && service.url) {
        try {
            logo = new URL('/favicon.ico', service.url).href;
        } catch {
            // Invalid or relative service URLs cannot provide an origin favicon.
        }
    }
    const canRedirect = Boolean(service.url) && service.redirect !== false;
    const content = (
        <>
            <span className={`service-icon icon-${service.color}`}>
                {logo && logo !== failedLogo ? <img src={logo} alt="" onError={() => setFailedLogo(logo!)} /> : <Icon size={20} strokeWidth={1.7} data-icon={service.icon} aria-hidden="true" />}
            </span>
            <span className="service-copy"><strong>{service.name}</strong><span>{service.description}</span></span>
            {canRedirect && <ArrowUpRight className="service-arrow" size={17} aria-hidden="true" />}
        </>
    );

    return canRedirect ? (
        <a className="service-card" href={service.url} target="_blank" rel="noopener noreferrer">{content}</a>
    ) : (
        <div className={`service-card ${service.url ? 'service-disabled' : 'service-placeholder'}`} title={service.url ? 'Navigation disabled by configuration' : 'Dịch vụ mẫu — hãy thêm URL trong cấu hình'}>{content}</div>
    );
}

export default function ServiceList({ services }: { services: Service[] }) {
    const [page, setPage] = useState(0);
    const [direction, setDirection] = useState<'next' | 'previous' | null>(null);
    const pageCount = Math.ceil(services.length / PAGE_SIZE);
    const visibleServices = services.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    return (
        <div className="service-list">
            <div key={page} className={`service-grid${direction ? ` service-grid-${direction}` : ''}`}>
                {visibleServices.length ? visibleServices.map((service) => <ServiceCard key={service.name} service={service} />) : <p className="empty-services">Chưa có dịch vụ nào trong nhóm này.</p>}
            </div>
            {pageCount > 1 && (
                <nav className="service-pagination" aria-label="Service pages">
                    <button type="button" aria-label="Previous service page" onClick={() => { setDirection('previous'); setPage((current) => Math.max(0, current - 1)); }} disabled={page === 0}><ArrowLeft size={16} aria-hidden="true" /></button>
                    <span aria-live="polite">{page + 1} <span aria-hidden="true">/</span> {pageCount}</span>
                    <button type="button" aria-label="Next service page" onClick={() => { setDirection('next'); setPage((current) => Math.min(pageCount - 1, current + 1)); }} disabled={page === pageCount - 1}><ArrowRight size={16} aria-hidden="true" /></button>
                </nav>
            )}
        </div>
    );
}

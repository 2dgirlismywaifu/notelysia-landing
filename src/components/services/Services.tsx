import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { ArrowUpRight, CalendarDays, CheckSquare, Cloud, FileText, Image, LayoutGrid, MessageCircle, Monitor, Play, Server, Shield, UsersRound } from 'lucide-react';
import { SiLinux } from 'react-icons/si';
import type { Service, ServiceGroup } from '../../config/site';

const icons = { cloud: Cloud, photo: Image, play: Play, server: Server, message: MessageCircle, calendar: CalendarDays, file: FileText, check: CheckSquare, linux: SiLinux, shield: Shield, monitor: Monitor };
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

export default function Services({ groups }: { groups: ServiceGroup[] }) {
    const [selected, setSelected] = useState(0);
    const refs = useRef<(HTMLButtonElement | null)[]>([]);
    const active = groups[selected];

    function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
        let next = index;
        if (event.key === 'ArrowRight') next = (index + 1) % groups.length;
        else if (event.key === 'ArrowLeft') next = (index - 1 + groups.length) % groups.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = groups.length - 1;
        else return;
        event.preventDefault();
        setSelected(next);
        refs.current[next]?.focus();
    }

    if (!active) return null;
    return (
        <section className="services" aria-label="Danh sách dịch vụ">
            <div className="services-heading"><div><span className="eyebrow">YOUR CORNER OF THE INTERNET</span><h2>Make yourself at home<span>.</span></h2></div><span className="section-index">01 / THE DIRECTORY</span></div>
            <div className="tab-bar" role="tablist" aria-label="Nhóm dịch vụ">
                {groups.map((group, index) => {
                    const TabIcon = group.id === 'site' ? LayoutGrid : UsersRound;
                    return <button key={group.id} ref={(node) => { refs.current[index] = node; }} id={`tab-${group.id}`} className={`tab ${index === selected ? 'active' : ''}`} role="tab" type="button" aria-selected={index === selected} aria-controls={`panel-${group.id}`} tabIndex={index === selected ? 0 : -1} onClick={() => setSelected(index)} onKeyDown={(event) => onKeyDown(event, index)}><TabIcon size={16} /><span>{group.label}</span><span className="tab-count">{String(group.services.length).padStart(2, '0')}</span></button>;
                })}
            </div>
            {groups.map((group, index) => (
                <div key={group.id} role="tabpanel" id={`panel-${group.id}`} aria-labelledby={`tab-${group.id}`} className="service-grid" tabIndex={0} hidden={index !== selected}>
                    {index === selected && (active.services.length ? active.services.map((service) => <ServiceCard key={service.name} service={service} />) : <p className="empty-services">Chưa có dịch vụ nào trong nhóm này.</p>)}
                </div>
            ))}
            <p className="services-note"><span /> A little collection of useful things {groups.some((group) => group.services.some((service) => !service.url)) && <><span className="note-divider">·</span><span className="sample-note">Example services — configure your links</span></>}</p>
        </section>
    );
}
import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { LayoutGrid, UsersRound } from 'lucide-react';
import type { ServiceGroup } from '../../config/site';
import ServiceList from './ServiceList';

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
                <div key={group.id} role="tabpanel" id={`panel-${group.id}`} aria-labelledby={`tab-${group.id}`} className="service-panel" tabIndex={0} hidden={index !== selected}>
                    {index === selected && <ServiceList key={group.id} services={group.services} />}
                </div>
            ))}
            <p className="services-note"><span /> A little collection of useful things {groups.some((group) => group.services.some((service) => !service.url)) && <><span className="note-divider">·</span><span className="sample-note">Example services — configure your links</span></>}</p>
        </section>
    );
}
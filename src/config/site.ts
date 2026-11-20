import serviceGroups from './services.json';

export type Service = {
    name: string;
    description: string;
    url?: string;
    logo?: string | null;
    color: string;
    icon: 'cloud' | 'photo' | 'play' | 'server' | 'message' | 'calendar' | 'file' | 'check' | 'linux';
};

export type ServiceGroup = { id: 'site' | 'team'; label: string; services: Service[] };

export const site = {
    name: 'Notelysia',
    // Ví dụ: { latitude: 21.03, longitude: 105.85, name: 'Hà Nội' }
    fallbackLocation: undefined as { latitude: number; longitude: number; name: string } | undefined,
    groups: serviceGroups as ServiceGroup[],
};
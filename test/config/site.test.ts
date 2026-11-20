import { describe, expect, it } from 'vitest';
import { site } from '../../src/config/site';
import serviceGroups from '../../src/config/services.json';

describe('site configuration', () => {
    it('loads valid service groups from the JSON file', () => {
        expect(site.groups).toEqual(serviceGroups);
        expect(site.groups.map(({ id }) => id)).toEqual(['site', 'team']);
        for (const group of site.groups) {
            expect(group.label).toBeTruthy();
            expect(Array.isArray(group.services)).toBe(true);
            for (const service of group.services) {
                expect(service.name).toBeTruthy();
                expect(typeof service.description).toBe('string');
                expect(['blue', 'peach', 'purple', 'green']).toContain(service.color);
                expect(['cloud', 'photo', 'play', 'server', 'message', 'calendar', 'file', 'check', 'linux']).toContain(service.icon);
                if (service.url) expect(new URL(service.url).protocol).toMatch(/^https?:$/);
                if (service.logo != null) expect(typeof service.logo).toBe('string');
            }
        }
    });
});
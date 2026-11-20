import { useEffect } from 'react';
import { ArrowDown, Heart, Sparkles } from 'lucide-react';
import fallbackFavicon from 'lucide-static/icons/sparkles.svg?url';
import Avatar, { gravatarUrl } from './components/avatar/Avatar';
import Background from './components/background/Background';
import Services from './components/services/Services';
import Weather from './components/weather/Weather';
import { site } from './config/site';

export default function App() {
    useEffect(() => {
        const favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
        if (!favicon) return;
        favicon.href = fallbackFavicon;
        if (!__GRAVATAR_HASH__) return;
        const image = new Image();
        image.onload = () => { favicon.href = image.src; };
        image.src = gravatarUrl(__GRAVATAR_HASH__, 64);
        return () => { image.onload = null; favicon.href = fallbackFavicon; };
    }, []);

    return (
        <div className="app-shell">
            <Background />
            <div className="page-content">
                <header className="topbar">
                    <a className="brand" href="#home" aria-label="Notelysia home"><Avatar compact /><span>notelysia<span className="brand-dot">.</span></span></a>
                    <div className="topbar-right"><span className="topbar-caption">A LITTLE SPACE ON THE INTERNET</span><span className="topbar-divider" /><Weather fallbackLocation={site.fallbackLocation} /></div>
                </header>
                <main id="home">
                    <section className="hero" aria-labelledby="welcome-title">
                        <div className="hero-overline"><span /> A PLACE TO CALL YOUR OWN <span /></div>
                        <Avatar />
                        <p className="hero-kicker"><Sparkles size={13} /> HELLO THERE, NICE TO SEE YOU</p>
                        <h1 id="welcome-title">welcome <em>landing page</em><span>.</span></h1>
                        <p className="hero-description">A quiet little place for all the things that matter.<br />Everything you need, right where you left it.</p>
                        <a className="discover-link" href="#directory">EXPLORE YOUR SPACE <ArrowDown size={14} /></a>
                    </section>
                    <div className="directory-wrap" id="directory"><Services groups={site.groups} /></div>
                </main>
                <footer className="footer"><span>© {new Date().getFullYear()} {site.name.toLowerCase()} <span className="footer-separator">/</span> YOUR SPACE, YOUR WAY</span><span>FROM ELYSIA WITH LOVE <Heart size={12} fill="currentColor" aria-hidden="true" /></span></footer>
            </div>
        </div>
    );
}
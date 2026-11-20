# Notelysia Landing

A personal landing page built with React, TypeScript, and Vite. The site runs entirely in the browser and can be deployed as a static site.

## Getting started

Node.js 20 or 22+ and npm are required. Install dependencies with `npm install`, then start the development server with `npm run dev`.

| Command           | Purpose                                              |
|-------------------|------------------------------------------------------|
| `npm run dev`     | Start the development server.                        |
| `npm run test`    | Run the test suite.                                  |
| `npm run build`   | Type-check and create a production build in `dist/`. |
| `npm run preview` | Preview the production build locally.                |

The site works without a configured email address or background images.

## Project structure

| Path              | Contents                                                             |
|-------------------|----------------------------------------------------------------------|
| `src/components/` | Feature components: avatar, background, services, and weather.       |
| `src/config/`     | Shared site configuration and the `services.json` service directory. |
| `src/assets/`     | Bundled assets, including backgrounds and local service icons.       |
| `test/`           | Tests organized by component and configuration.                      |

## Site configuration

Edit `src/config/site.ts` to change these site-wide settings. Rebuild and deploy the site for changes to appear in production.

| Setting            | Purpose                                                      |
|--------------------|--------------------------------------------------------------|
| `name`             | Site name used in the footer.                                |
| `sourceUrl`        | Repository URL opened by the GitHub button in the top bar.   |
| `fallbackLocation` | Optional fallback weather location; see [Weather](#weather). |

## Gravatar

Set `GRAVATAR_EMAIL` in `.env` (see `.env.example`), then restart the dev server or rebuild. The email is normalized and SHA-256 hashed at build time; the page contains the hash, not the raw email. `.env` is ignored by Git.

The hash is public and may be matched against known email addresses, so it should not be considered email protection. Gravatar is used for the avatar, top-bar logo, and favicon. If no email is configured or no Gravatar image exists, the site displays fallback icons.

## Services and logos

Edit `src/config/services.json`. Each group has an `id`, `label`, and `services` array. Use `site` for personal services and `team` for team services.

| Service field         | Purpose                                                                                                                                    |
|-----------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| `name`, `description` | Display name and short description.                                                                                                        |
| `url`                 | Destination URL for the service.                                                                                                           |
| `redirect`            | `true` allows navigation; `false` renders a non-clickable card. Defaults to `true` when omitted.                                           |
| `color`               | Card icon color. Supported values: `blue`, `peach`, `purple`, `green`.                                                                     |
| `icon`                | Fallback icon. Supported values: `cloud`, `photo`, `play`, `server`, `message`, `calendar`, `file`, `check`, `linux`, `shield`, `monitor`. |
| `logo`                | Optional image URL, public path, local bundled asset, or `null` to always use the fallback icon.                                           |

| Logo configuration             | Behavior                                                                 |
|--------------------------------|--------------------------------------------------------------------------|
| `logo` omitted                 | Uses `/favicon.ico` from the service URL's domain.                       |
| Image URL or `/public` path    | Loads that image, for example `/logos/my-service.png`.                   |
| `"logo": "asset:filename.ico"` | Bundles an `.ico` from `src/assets/ico/` with Vite.                      |
| `"logo": null`                 | Always uses the configured library icon; Cockpit uses `"icon": "linux"`. |

Prefer `https://` URLs. Clickable service links open in a new tab; a failed logo falls back to the configured icon.

The current directory includes:

| Group  | Services                                             |
|--------|------------------------------------------------------|
| `site` | AdGuard Home, Cockpit, Jellyfin, WireGuard, RustDesk |
| `team` | Gunny Taskbar                                        |

Jellyfin uses a versioned favicon path; update its `logo` if a Jellyfin upgrade changes that path. If a service favicon requires authentication or does not return an image, use a publicly accessible image or bundle a local logo. Groups may be empty.

Vite reads the JSON configuration during development. Rebuild and deploy after changing it; this file is not a database or an online admin interface.

## Background images

Add images to `src/assets/backgrounds/` with names such as `background-1.jpg`, `background-2.webp`, and `background-10.png`. Supported extensions are `.jpg`, `.jpeg`, `.png`, and `.webp`; images are sorted numerically. If two files have the same number, their filenames determine the order. Rebuild and deploy after adding or replacing images. If no image is available, a default gradient is shown.

With two or more images, desktop shows previous/next buttons at the sides. On mobile, those are replaced by a compact bottom control with previous/next buttons and an image counter. The background remains blurred on both form factors.

## Weather

The widget requests the browser's location and gets current weather from Open-Meteo; no API key is required. Geolocation requires HTTPS or localhost. If permission is denied or location is unavailable, set `fallbackLocation` in `src/config/site.ts`, for example `{ latitude: 21.03, longitude: 105.85, name: 'Hanoi' }`. By default there is no fallback location, so the widget offers guidance and a retry action. Network errors also include a retry action.

Choose **Find a location**, enter at least two characters, and select a result from Open-Meteo. Use the arrow keys, Enter, and Escape to navigate. The selected location is stored in the browser; choose **Use current location** to clear it and return to browser geolocation. Search text and coordinates used for weather requests are sent to Open-Meteo. No account or API key is needed.

## Cloudflare Pages

Connect the repository to Cloudflare Pages, set the build command to `npm run build`, and set the output directory to `dist`. Add `GRAVATAR_EMAIL` as a build environment variable if you want to use Gravatar. Keep it protected in Cloudflare and do not commit it. The site does not require a backend.

Add `notelysia.com` under **Custom domains** in Cloudflare Pages and follow its instructions for verifying and configuring DNS for the apex domain. The domain must belong to the relevant Cloudflare zone. Check existing DNS records before changing them so service subdomains are not affected. This project does not configure Cloudflare automatically.

## GitHub Actions deployment to a self-hosted server

The `.github/workflows/deploy.yml` workflow runs tests and builds on a GitHub-hosted runner for pull requests to `main`, pushes to `main`, and manual runs. On a push or manual run on `main`, GitHub sends the `dist/` artifact to a GitHub Actions self-hosted runner on the server, which copies it to the web directory. The server does not need inbound SSH; the runner connects outbound to GitHub. Pull-request builds do not receive the `GRAVATAR_EMAIL` secret.

Register a **GitHub Actions self-hosted runner** on the server, label it `notelysia-landing-ci`, and run it as an account that can write to the web directory. Do not run it as `root`. The server needs outbound HTTPS access to GitHub so the runner can receive jobs and download artifacts; `rsync` must be installed. Only deployments on `main` use this runner, not pull requests.

Under **Settings → Environments → `landing-env` → Environment variables**, create:

| Variable      | Purpose                                                                                                 |
|---------------|---------------------------------------------------------------------------------------------------------|
| `DEPLOY_PATH` | Dedicated absolute path for the site, writable by the runner account, for example `/var/www/notelysia`. |

Under **Settings → Secrets and variables → Actions → Repository secrets**, create `GRAVATAR_EMAIL` if you want to use Gravatar. This secret is also supplied as a build environment variable where needed.

The sync command deletes old files in `DEPLOY_PATH`, so do not share that directory with other data.

An existing GitLab Runner does not run GitHub Actions workflows directly. A GitHub Actions runner can be installed alongside it on the same server; they are separate services.

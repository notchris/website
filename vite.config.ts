import { defineConfig, type Plugin } from "vite";
import handlebars from "vite-plugin-handlebars";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";
import fs from "node:fs/promises";

type PageData = Record<string, unknown>;

const pagesDir = resolve(import.meta.dirname, "pages");

const pageData: Record<string, PageData> = {
    "/index.html": {
        title: "Home",
    },
    "/projects/index.html": {
        title: "Projects",
    },
    "/projects/tcvs/index.html": {
        title: "TCVS",
    },
    "/projects/3d-rule-tile/index.html": {
        title: "Unity 3D Rule Tile",
    },
    "/projects/campfire/index.html": {
        title: "Campfire",
    },
    "/projects/minigolf/index.html": {
        title: "MiniGolf",
    },
    "/projects/guitar/index.html": {
        title: "Acoustic Guitar",
    },
    "/projects/slime/index.html": {
        title: "Sliiime",
    },
    "/audio/index.html": {
        title: "Audio",
    },
    "/audio/twitch/index.html": {
        title: "Twitch Song Clip Project",
    },
    "/audio/twitch/about/index.html": {
        title: "About Twitch Song Clip Project",
    },
    "/other/index.html": {
        title: "Other",
    },
};

function getPageInputs(): Record<string, string> {
    return {
        main: resolve(import.meta.dirname, "index.html"),

        projects: resolve(pagesDir, "projects/index.html"),
        "projects/tcvs": resolve(pagesDir, "projects/tcvs/index.html"),
        "projects/3d-rule-tile": resolve(
            pagesDir,
            "projects/3d-rule-tile/index.html",
        ),
        "projects/campfire": resolve(
            pagesDir,
            "projects/campfire/index.html",
        ),
        "projects/minigolf": resolve(
            pagesDir,
            "projects/minigolf/index.html",
        ),
        "projects/guitar": resolve(
            pagesDir,
            "projects/guitar/index.html",
        ),
        "projects/slime": resolve(
            pagesDir,
            "projects/slime/index.html",
        ),

        audio: resolve(pagesDir, "audio/index.html"),
        "audio/twitch": resolve(pagesDir, "audio/twitch/index.html"),
        "audio/twitch/about": resolve(
            pagesDir,
            "audio/twitch/about/index.html",
        ),

        other: resolve(pagesDir, "other/index.html"),
    };
}

function removeJSON(): Plugin {
    return {
        name: "remove-songs-json",
        apply: "build",

        async closeBundle() {
            await fs.rm(
                resolve(import.meta.dirname, "dist/data"),
                { recursive: true, force: true },
            );
        }
    };
}

function rewriteURLs(): Plugin {
    return {
        name: "clean-url-pages",

        configureServer(server) {
            server.middlewares.use(async (req, res, next) => {
                if (!req.url || req.method !== "GET") {
                    next();
                    return;
                }

                const url = new URL(req.url, "http://localhost");
                let pathname = url.pathname;

                // ignore files/assets.
                if (
                    pathname.includes(".") ||
                    pathname.startsWith("/src/") ||
                    pathname.startsWith("/assets/")
                ) {
                    next();
                    return;
                }

                // for dev
                if (!pathname.endsWith("/")) {
                    pathname += "/";
                }

                const htmlPath = resolve(
                    pagesDir,
                    `.${pathname}index.html`,
                );

                try {
                    await fs.access(htmlPath);
                } catch {
                    next();
                    return;
                }

                try {
                    const html = await fs.readFile(htmlPath, "utf-8");

                    const transformed = await server.transformIndexHtml(
                        pathname,
                        html,
                    );

                    res.statusCode = 200;
                    res.setHeader("Content-Type", "text/html");
                    res.end(transformed);
                } catch (error) {
                    next(error);
                }
            });
        },
    };
}

export default defineConfig({
    plugins: [
        tailwindcss(),
        handlebars({
            partialDirectory: resolve(
                import.meta.dirname,
                "src/partials",
            ),

            context(pagePath) {
                let normalizedPath = pagePath.startsWith("/")
                    ? pagePath
                    : `/${pagePath}`;

                if (normalizedPath.endsWith("/")) {
                    normalizedPath += "index.html";
                }

                return pageData[normalizedPath] ?? {};
            },

            helpers: {
                now: () => new Date().getFullYear(),
            },
        }),

        rewriteURLs(),
        removeJSON()
    ],

    build: {
        rollupOptions: {
            input: getPageInputs()
        },
    },
});
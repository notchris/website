const button = document.querySelector<HTMLButtonElement>("#darkmode");
const moon = document.querySelector<SVGElement>("#darkmode-moon");
const sun = document.querySelector<SVGElement>("#darkmode-sun");


const updateIcon = () => {
    const isDark = document.documentElement.classList.contains("dark");
    moon?.classList.toggle("hidden", isDark);
    sun?.classList.toggle("hidden", !isDark);
};

const setDarkMode = () => {
    const isDark = localStorage.getItem("darkmode") === "true";
    document.documentElement.classList.toggle("dark", isDark);
    updateIcon();
};

const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("darkmode", String(isDark));
    updateIcon();
};

button?.addEventListener("click", toggleDarkMode);

const setActiveNavLink = () => {
    const currentPath = window.location.pathname;
    document.querySelectorAll<HTMLAnchorElement>(".nav-link").forEach((link) => {
        const linkPath = new URL(link.href).pathname;
        if (
            currentPath === linkPath ||
            (linkPath !== "/" && currentPath.startsWith(linkPath))
        ) {
            link.classList.add("nav-link-active");
        }
    });
}

setActiveNavLink();

setDarkMode();
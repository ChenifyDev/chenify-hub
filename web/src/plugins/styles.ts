const ATTR = "data-plugin-style";
const SCOPE_ATTR = "data-plugin";

type Sheet = { element: HTMLStyleElement; entries: Map<string, string> };

const sheets = new Map<string, Sheet>();

function mount(pluginId: string): Sheet {
    const existing = sheets.get(pluginId);
    if (existing?.element.isConnected) return existing;

    const element = document.createElement("style");
    element.setAttribute(ATTR, pluginId);
    document.head.appendChild(element);
    const sheet: Sheet = { element, entries: existing?.entries ?? new Map() };
    sheets.set(pluginId, sheet);
    return sheet;
}

function render(sheet: Sheet): void {
    sheet.element.textContent = [...sheet.entries.values()].join("\n");
}

export function setPluginStyle(pluginId: string, key: string, css: string): void {
    const sheet = mount(pluginId);
    sheet.entries.set(key, css);
    render(sheet);
}

export function dropPluginStyles(pluginId: string): void {
    const sheet = sheets.get(pluginId);
    if (!sheet) return;
    sheet.element.remove();
    sheets.delete(pluginId);
}

export function setPluginScope(pluginIds: readonly string[]): void {
    if (pluginIds.length) document.documentElement.setAttribute(SCOPE_ATTR, pluginIds.join(" "));
    else document.documentElement.removeAttribute(SCOPE_ATTR);
}

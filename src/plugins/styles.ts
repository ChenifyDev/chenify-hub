/**
 * 插件样式表管理。
 *
 * 每个插件在 <head> 里拥有若干个 <style data-plugin-style="<pluginId>">，
 * 由本模块统一创建/更新/移除。放在这里单独成文件是为了让 styles.ts（纯 DOM 操作）
 * 不被 api.tsx 之类的模块反向依赖。
 */

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

/** 设置插件的一段样式。key 用于同一插件内去重与单独移除。 */
export function setPluginStyle(pluginId: string, key: string, css: string): void {
    const sheet = mount(pluginId);
    sheet.entries.set(key, css);
    render(sheet);
}

export function removePluginStyle(pluginId: string, key: string): void {
    const sheet = sheets.get(pluginId);
    if (!sheet) return;
    if (sheet.entries.delete(key)) render(sheet);
}

/** 移除插件的全部样式（禁用或卸载插件时调用）。 */
export function dropPluginStyles(pluginId: string): void {
    const sheet = sheets.get(pluginId);
    if (!sheet) return;
    sheet.element.remove();
    sheets.delete(pluginId);
}

/**
 * 把启用中的插件 id 写到 <html data-plugin="a b"> 上，
 * 插件即可用 html[data-plugin~="my-plugin"] 把自己限定在生效状态内。
 */
export function setPluginScope(pluginIds: readonly string[]): void {
    if (!pluginIds.length) {
        delete document.documentElement.dataset[SCOPE_ATTR];
        return;
    }
    document.documentElement.setAttribute(SCOPE_ATTR, pluginIds.join(" "));
}

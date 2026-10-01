# UI 插件开发指南

插件可以整体替换 ChenifyHub 的界面组件 —— 按钮、卡片、输入框、弹窗、菜单等等。
所有安装、转译、加载都在浏览器本地完成，不需要后端，也不需要构建步骤。

仓库里有两个可运行示例：

- [`samples/plugin-cozy-purple`](../samples/plugin-cozy-purple) —— 4 个插槽，最小上手
- [`samples/plugin-terminal`](../samples/plugin-terminal) —— **全部 55 个插槽**，黑白单色终端风，
  演示兄弟节点注入、破坏性反色、CRT 特效与逐插槽结构改造

安装方式就是把这个文件夹整个拖进 `/plugins` 页面。

写 TypeScript 的话顺手把类型模板也下下来（`/plugins` 页面上的按钮），
每个插槽的 props 都是精确类型，见 [§4 类型支持](#类型支持)。

> **安全提示：插件代码会以任意 JavaScript 的权限在你的浏览器里执行。**
> 宿主只限制了插件能 `import` 什么，但 `new Function` 跑在页面上下文里，
> 插件依然能访问 `globalThis` 上的任何东西。只安装你信任的插件。

## 1. 目录结构

```
cozy-purple/
├── plugin.json
└── ui/
    ├── styles.css
    ├── button.tsx
    └── card.tsx
```

- 根目录必须有 `plugin.json`。
- 必须有 `ui/` 目录，否则安装会被拒绝。
- 上限 200 个文件、单文件 4MB、总体积 16MB。ZIP 里的路径不能跳出包根目录。
- 目录里别放 `tsconfig.json` 之类开发用的东西 —— 它们会被一起装进 IndexedDB。
  类型支持见 [§4 类型支持](#类型支持)。

## 2. plugin.json

```json
{
    "id": "cozy-purple",
    "name": "Cozy Purple",
    "version": "1.0.0",
    "author": "你的名字",
    "description": "一句话说明这个插件做了什么。",
    "ui": {
        "style": ["ui/styles.css"],
        "components": {
            "button": "ui/button.tsx",
            "card": "ui/card.tsx"
        }
    }
}
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `id` | 是 | 唯一标识。只能包含小写字母、数字、`.` `_` `-`，**且必须以小写字母或数字开头**，最长 64 位。重复安装视为更新。 |
| `name` | 是 | 展示名。 |
| `version` | 否 | 默认 `0.0.0`。 |
| `author` / `description` | 否 | 仅展示。 |
| `ui.style` | 否 | 注入 `<head>` 的 CSS 文件数组，卸载时自动移除。 |
| `ui.components` | 否 | 插槽名 → TSX 模块路径，模块的 `default` 导出就是替换组件。 |

`ui.style` 和 `ui.components` 至少要有一个，否则装上去不会有任何效果。

路径相对于 `plugin.json` 所在目录，可以用 `./` 前缀，也可以用 `/` 从包根开始写。

想让编辑器补全插槽名、把写错的标红，把类型包里的 `plugin.schema.json` 拷一份到
插件根目录（见 [§4 类型支持](#类型支持)）：

```json
{
    "$schema": "./plugin.schema.json",
    "id": "cozy-purple"
}
```

不写 `$schema` 的话，多数编辑器也会自动找同目录下的 `*.schema.json`。

## 3. 组件插槽

插槽名 = 宿主导出名的首字母小写（`Button` → `button`，`CardHeader` → `cardHeader`）。
可用的 55 个插槽：

| 文件 | 插槽 |
| --- | --- |
| `button.tsx` | `button` |
| `card.tsx` | `card` `cardHeader` `cardFooter` `cardTitle` `cardAction` `cardDescription` `cardContent` |
| `badge.tsx` | `badge` |
| `input.tsx` | `input` |
| `label.tsx` | `label` |
| `separator.tsx` | `separator` |
| `skeleton.tsx` | `skeleton` |
| `checkbox.tsx` | `checkbox` |
| `tabs.tsx` | `tabs` `tabsList` `tabsTrigger` `tabsContent` |
| `dialog.tsx` | `dialog` `dialogClose` `dialogContent` `dialogDescription` `dialogFooter` `dialogHeader` `dialogOverlay` `dialogPortal` `dialogTitle` `dialogTrigger` |
| `sheet.tsx` | `sheet` `sheetTrigger` `sheetClose` `sheetContent` `sheetHeader` `sheetFooter` `sheetTitle` `sheetDescription` |
| `dropdown-menu.tsx` | `dropdownMenu` `dropdownMenuPortal` `dropdownMenuTrigger` `dropdownMenuContent` `dropdownMenuGroup` `dropdownMenuLabel` `dropdownMenuItem` `dropdownMenuCheckboxItem` `dropdownMenuRadioGroup` `dropdownMenuRadioItem` `dropdownMenuSeparator` `dropdownMenuShortcut` `dropdownMenuSub` `dropdownMenuSubTrigger` `dropdownMenuSubContent` |
| `tooltip.tsx` | `tooltip` `tooltipTrigger` `tooltipContent` `tooltipProvider` |

插槽名写错会在安装时直接报错，并把可用列表打出来。

也可以在运行时读 `plugin.slots` 拿到这张表。

## 4. 写组件

推荐在宿主默认实现之上叠加，而不是从头重写：

```tsx
import { useHostUI } from "@/plugins/api";
import { cn } from "@/lib/utils";

export default function Button(props) {
    const Host = useHostUI("button");
    if (!Host) return null;
    return <Host {...props} className={cn("rounded-full font-semibold", props.className)} />;
}
```

**必须用 `useHostUI(slot)` 拿宿主实现，不能从 `@/components/ui/button` import。**
后者拿到的是已经被插件替换过的版本，再赋回同一插槽会无限递归。

### props 契约

- `props` 原样透传给宿主实现，签名与宿主组件一致（插槽名即宿主导出名小写）。
- **必须保留宿主传下来的 `data-slot` 属性** —— 站点自身的 CSS 靠它做选择器
  （例如 `has-[>[data-slot=button-group]]`）。透传整个 `props` 即可满足，
  自己重新拼 className 时别把它丢掉。
- 模块必须 `default` 导出一个函数组件；没有 default 导出会在加载时报错
  （见 §10）。
- 宿主只**转译**插件，不做类型检查：`tsc` 的报错不会阻止安装，但会在运行时炸在
  对应插槽上。作者自己可以查 —— 下面这一节就是干这个的。

### 类型支持

宿主组件的 props 就是你的 props 契约，所以类型直接从站点源码生成，不会和实现漂移：
宿主给 `Button` 加了 `size`、改了 `variant`，你重新下载类型模板就跟着变。

在 `/plugins` 页面点「下载类型模板」拿到 `chenify-plugin-types.zip`，解压到**插件目录的隔壁**：

```
workspace/
├── my-plugin/                 ← 拖进 /plugins 的只有这个
│   ├── plugin.json
│   ├── ui/button.tsx
│   └── tsconfig.json          ← { "extends": "../chenify-plugin-types/tsconfig.json", "include": ["ui"] }
└── chenify-plugin-types/      ← 解压出来的类型包
    ├── tsconfig.json          ← 基线配置，已经把 @/* 指到 types/src/*
    ├── types/src/**.d.ts      ← 宿主声明（插件 API、55 个插槽、cn）
    ├── plugin.schema.json     ← plugin.json 的 JSON Schema
    └── README.md
```

> 类型包**不要放进插件包里**：它会跟着被装进 IndexedDB，白白吃掉 200 文件 / 16MB 的额度。

装依赖，起步只要两个：

```bash
npm i -D typescript @types/react
```

这样就能开始写了，`card*` `input` `label` `skeleton` `dropdownMenuShortcut`
`dialogHeader/Footer` `sheetHeader/Footer` 这些纯 DOM 的插槽立刻就是字段级精确的。

其余插槽（`button` `badge` `checkbox` `separator` `tabs*` `dialog*` `sheet*`
`dropdownMenu*` `tooltip*`）的 props 来自 Base UI 原语，**不装 `@base-ui/react`
也能编**（那部分 props 退化成 `any`，不报错、也不校验），想要字段级类型就按站点的
版本补上这几个包：

```bash
npm i -D @base-ui/react class-variance-authority lucide-react
```

`lucide-react` 只在你用图标时才需要，版本对着站点 `package.json` 抄。

写起来是这样，`props` 的字段、补全、拼错的插槽名都会被 `tsc` 抓住：

```tsx
import { cn } from "@/lib/utils";
import { useHostUI, type SlotProps } from "@/plugins/api";

export default function Button(props: SlotProps<"button">) {
    const Host = useHostUI("button");
    if (!Host) return null;
    return <Host {...props} className={cn("rounded-full font-semibold", props.className)} />;
}
```

- `SlotProps<"button">` 就是宿主 `Button` 的 props 类型；55 个插槽都可用。
- `useHostUI("button")` 返回的组件也有类型，`props` 不写注解也推断得出来。
- `plugin.*`、`cn` 同样有类型（`@/plugins/api`、`@/lib/utils`）。
- 类型只用 `import type` 引。sucrase 会把 `import type` 整条擦掉，运行时不需要它。
- 插槽名拼错会直接报 `Type '"buton"' does not satisfy the constraint 'PluginSlot'`。

`plugin.json` 也有校验：把类型包里的 `plugin.schema.json` 拷一份到插件根目录，
编辑器就会补全插槽名，并把拼错的、未声明的插槽标红。

> 类型包是**快照**。站点升级过宿主组件后，重新下载一次即可。
> 仓库里的示例（[`samples/*`](../samples)）用的就是同一份产物，`bun run typecheck:plugins`
> 会重新生成并以 `strict` 检查全部示例 —— 示例既是文档，也是这条链路的回归测试。

### 可以 import 的模块

插件的 `require` 由宿主代理，只有下面这些可用，其他一律报错：

| 模块 | 内容 |
| --- | --- |
| `react`、`react-dom`、`react-dom/client`、`react/jsx-runtime`、`react/jsx-dev-runtime` | 宿主的那一份 React 实例，hooks 才能正常工作 |
| `lucide-react` | 图标。应用自己用到的那些零成本；用到的其他图标会在首次需要时按需下载（约 127KB gzip，只下一次） |
| `class-variance-authority` | `cva` |
| `clsx` | `clsx` |
| `tailwind-merge` | `twMerge` |
| `@base-ui/react/*` | 全部公开子路径，按需下载 |
| `@/lib/utils` | `cn` |
| `@/components/ui/*` | 宿主 UI 组件（**注意上面的递归陷阱**） |
| `@/plugins/api` | `plugin`、`useHostUI`、`usePluginUI` |
| `./relative` | 插件包内的相对路径，扩展名可省（宿主自动补 `.ts`/`.tsx`/… 与 `/index`），也支持 `.css` 与图片等静态资源 |

```tsx
// 图片资源：import 出来就是 blob URL
import logo from "./logo.png";
```

### 样式

Tailwind 工具类里，`src/index.css` 用 `@source inline(...)` 白名单补了一批常见类，
应用自身用到的类也照常生成。白名单之外的类**不会报错，只是没有样式**。
需要别的样式就在 `ui/styles.css` 里写普通 CSS，那部分会原样注入。

覆盖 CSS 变量是最省事的做法，站点所有用到它的地方都会跟着变：

```css
:root {
    --primary: oklch(0.55 0.22 295);
    --radius: 0.85rem;
}
```

## 5. 宿主 API

```tsx
import { plugin } from "@/plugins/api";

plugin.id;                          // "cozy-purple"，与 plugin.json 一致
plugin.name;                        // "Cozy Purple"
plugin.version;                     // "1.0.0"
plugin.slots;                       // 全部 55 个插槽名
plugin.site;                        // { name, origin }
plugin.navigate("/explore-posts");  // 站内跳转
plugin.toast.message("提示");
plugin.toast.success("装好了");
plugin.toast.error("失败了");
plugin.currentUser();               // { id, username, avatar } | null
plugin.storage.set("k", "v");       // 自动加 plugin:<id>: 前缀
```

- `plugin.storage` 是同步的 localStorage 封装，只有 `get` / `set` / `remove` 三个方法，
  键会自动加上 `plugin:<id>:` 前缀，所以插件之间互不干扰。写入超配额会弹 toast 提示。
- `plugin.navigate(to)` **只接受以单个 `/` 开头的站内路径**。`//evil.com`、
  `https://…`、缺 `/` 的写法都会被静默忽略，不报错也不跳转。
- `plugin.currentUser()` 在未登录时返回 `null`。

刻意不提供 `fetch`、原始 `localStorage` 和登录 token —— 插件的定位是美化 UI，
不是读写社区数据。需要持久化就用 `plugin.storage`。

## 6. 多插件与覆盖顺序

插件按管理页里的顺序叠加，同一插槽**后面的插件覆盖前面的**。
每个组件外面都包了 ErrorBoundary：插件渲染抛错时只降级这一个组件回默认外观，
并把错误显示在 `/plugins` 页面，不会白屏。

### 更新与卸载

- **同 `id` 再次安装 = 更新**，不会产生两条记录。已有的启用状态（`enabled`）、
  排序位置（`order`）、首次安装时间（`installedAt`）都会保留，新文件覆盖旧文件。
- 新 `id` 安装时默认启用，并排在列表最后（优先级最低），可自行上移。
- 卸载只清这一个插件的文件与样式，不影响其它插件。
- 停用只是不覆盖，文件仍保留在 IndexedDB 里，随时可以再启用。

## 7. 安装方式

`/plugins` 页面（无需登录）支持三种：

- **选择文件夹** —— 选中插件根目录（`webkitdirectory`），浏览器会把目录名放进
  每个文件的相对路径里，宿主会自动剥掉这层公共前缀。
- **选择 ZIP** —— 根目录直接是 `plugin.json` 的 zip；zip 内若统一多一层目录，
  且那层目录下有 `plugin.json`，也会自动剥离。
- **从 URL 安装** —— 指向 **`plugin.json` 的地址，不是 zip**。

远程安装的文件清单**只**来自 manifest 里的 `files` 数组，因此它必须列出包内所有
文件，**并把 `plugin.json` 自己也写进去**（宿主不会自动补上）：

```json
{
    "id": "cozy-purple",
    "name": "Cozy Purple",
    "ui": {
        "style": ["ui/styles.css"],
        "components": { "button": "ui/button.tsx" }
    },
    "files": ["plugin.json", "ui/styles.css", "ui/button.tsx"]
}
```

各条目相对 manifest 所在 URL 解析，所以源站需要允许跨域访问。

装完可以随时停用、调整覆盖顺序、卸载。所有数据存在浏览器的 IndexedDB
（数据库 `chenify-plugins`），不会上传，卸载插件也不会影响其它插件。

## 8. 工作原理

1. 读取文件 → 校验体积、`plugin.json`、插槽名、引用是否存在。
2. 存进 IndexedDB。
3. 插件启用时，先扫源码里用到的 `@base-ui/react/*` 与图标，按需动态 import，
   再懒加载 `sucrase`。
4. 每个 TSX 模块转成 CJS，用 `new Function` + require 代理求值，模块缓存与循环依赖都做了处理。
5. 覆盖表只在启用插件集合变化时重建 —— 否则输入框会失焦、编辑器会丢状态。
6. 启用的插件 id 写到 `<html data-plugin="a b">`，方便你自己的 CSS 做判断。

没装任何插件的用户不会下载 `sucrase`、Base UI 长尾和图标集：
`src/index.css` 之外那两块都是懒加载 chunk。

## 9. 调试

- **只炸一个组件，不会白屏。** 每个插槽都套着 ErrorBoundary，渲染抛错时该插槽
  退回宿主默认外观，其余插件照常工作。
- **看 `/plugins` 的「运行时错误」卡片。** 每条错误带插件名、插槽名、发生时间；
  出错的插件卡片上还会显示「N 个错误」徽标。修好后重新安装即可清掉
  （重建覆盖表会整体替换错误列表）。
- **浏览器 console 同样有完整堆栈。** ErrorBoundary 记录的是渲染期异常，
  模块加载/转译失败（`PluginResolveError`）则直接抛在安装或启用阶段。
- **没有 HMR。** 改完源码要重新装一次同 `id` 的插件才会生效（文件夹或 zip 都行），
  启用状态与顺序会保留。
- **类型错误不会拦你，但你自己能查。** 宿主只用 sucrase 转译，不做类型检查 ——
  报错只在运行时出现。装上 [§4 类型支持](#类型支持) 里的类型模板后，`tsc` 会在
  安装之前就把错 props、错插槽名揪出来。类型包是快照，站点组件改过之后要重新下载。
- **确认插件真的生效了：** `document.documentElement.dataset.plugin` 会是
  `"a b"` 这样的空格分隔 id 列表，也可以用它给自己的 CSS 做前缀选择器。
- **怀疑死循环 / 递归：** 九成是 §4 里那个 `@/components/ui/*` 的递归陷阱，
  改用 `useHostUI(slot)`。

## 10. 常见报错

### 安装前校验

| 报错文案 | 原因 | 修法 |
| --- | --- | --- |
| `文件数量超出上限（N > 200）` | 包内文件太多 | 精简资源 |
| `单个文件超过 4MB：<path>` | 单文件超限 | 压缩或拆分 |
| `插件包总体积超过 16MB` | 总量超限 | 精简资源 |
| `plugin.json 不是合法的 JSON：<err>` | JSON 语法错 | 用编辑器校验 |
| `plugin.json 的 "id" 只能包含小写字母、数字、. _ -，且以字母或数字开头（最长 64 位）` | id 格式不符 | 例如用 `cozy-purple` |
| `plugin.json 缺少 "name"` | 缺 `name` | 补上 |
| `插件包必须包含 ui/ 目录（shadcn/ui + Base UI 格式的 .tsx 源码）` | 没有 `ui/` | 建 `ui/` 目录 |
| `插件包根目录缺少 plugin.json` | manifest 不在包根 | 移到根目录 |
| `插件包根目录缺少 plugin.json`（仅远程安装） | `files` 数组里漏了 `plugin.json` | 见 §7 |
| `插件没有声明任何 ui.style 或 ui.components，安装后不会产生任何效果` | 两个都空 | 至少填一个 |
| `未知的组件插槽 "<x>"。可用插槽：<列表>` | 插槽名写错 | 对照 §3 表 |
| `插槽 "<x>" 引用的文件不存在：<path>` | 路径写错 | 检查相对路径 |
| `插槽 "<x>" 必须指向一个 TSX/TS 源码文件：<path>` | 指到了 css/图片 | 改成 `.tsx` |
| `"ui.style" 引用的文件不存在：<path>` | 样式路径写错 | 检查 `ui.style` |
| `样式文件必须是文本：<path>` | 样式是二进制 | 用文本文件 |
| `文件含有非法字符：<path>` | 文件里有 `\0` | 重新保存该文件 |

### 选择文件夹 / ZIP 时

| 报错文案 | 原因 | 修法 |
| --- | --- | --- |
| `没有选中任何文件` | 空选择 | 重新选一次 |
| `一次只能选择一个插件目录（选中的文件不在同一个根目录下）` | 选到了多层父目录 | 直接选插件根目录 |
| `路径超出了插件包范围：<ref>` | zip 内有 `../` 逃逸 | 重新打包 |
| `路径不能是 URL：<ref>` | manifest 里写了绝对 URL | 用包内相对路径 |

### 远程安装

| 报错文案 | 原因 | 修法 |
| --- | --- | --- |
| `请填写 http(s) 开头的 plugin.json 地址` | 协议不对 | 用 https |
| `地址需要指向 plugin.json` | 填了 zip 或别的路径 | 指向 `plugin.json` |
| `远程安装要求 plugin.json 中包含 "files" 数组（列出 ui/ 下所有文件）` | 缺 `files` | 见 §7 |
| `"files" 中存在非字符串条目` | 数组里混了对象 | 全部写成字符串 |
| `拉取 plugin.json 失败：HTTP 404` | 地址错 / 源站没这个文件 | 检查 URL |
| `拉取 <path> 失败：HTTP <n>` | `files` 里某项拉不到 | 检查该项路径与源站 |
| `拉取 plugin.json 失败：<err>` | 跨域被拦 / 网络错 | 让源站允许 CORS |

### 加载与运行时

| 报错文案 | 原因 | 修法 |
| --- | --- | --- |
| `插件不支持导入 "<x>"（来自 <path>）。可用：react、…` | import 了白名单外的模块 | 见 §4 模块表 |
| `<path> 需要 default 导出一个 React 组件（插槽 "x"）` | 忘了 `export default` | 补 default 导出 |
| `插件包内找不到 <ref>（来自 <path>）` | 相对路径错 | 检查 import 路径 |
| `<path> 转译失败：<err>` | TSX 语法错 | 修语法（没类型检查，但语法会拦） |
| `<path> 执行失败：<err>` | 模块顶层代码抛错 | 把副作用挪进组件 |
| `未知的 Base UI 模块：<specifier>` | 用了非根导出的子路径 | 只用公开子路径 |

渲染期异常（不是上面这些）会出现在 `/plugins` 的「运行时错误」区，
格式是 `插件名 · 插槽 · 时间`，见 §9。

## 11. 附录：最小可复制插件

建一个目录 `my-first/`，放入下面三个文件，然后把整个文件夹拖进 `/plugins` 即可。

**`my-first/plugin.json`**

```json
{
    "id": "my-first",
    "name": "My First",
    "version": "1.0.0",
    "author": "你的名字",
    "description": "把按钮换成圆角胶囊。",
    "ui": {
        "style": ["ui/styles.css"],
        "components": {
            "button": "ui/button.tsx"
        }
    }
}
```

**`my-first/ui/button.tsx`**

```tsx
import { useHostUI, type SlotProps } from "@/plugins/api";
import { cn } from "@/lib/utils";

export default function Button(props: SlotProps<"button">) {
    const Host = useHostUI("button");
    if (!Host) return null;
    return <Host {...props} className={cn("rounded-full font-semibold shadow-none", props.className)} />;
}
```

`SlotProps<"button">` 那行需要类型模板（[§4 类型支持](#类型支持)）；没有它就把
参数写成 `(props)`，其余代码一字不用改 —— 宿主只转译，不检查类型。

**`my-first/ui/styles.css`**

```css
:root {
    --primary: oklch(0.55 0.22 295);
    --radius: 9999px;
}
```

装完的效果是：全站主色转紫，所有按钮变胶囊。改任意一个文件，把文件夹重新
装一次即可更新（同 `id`，启用状态与顺序保留）。

想看覆盖全部 55 个插槽、并且真的在改 DOM 结构的完整例子，
直接读 [`samples/plugin-terminal`](../samples/plugin-terminal)。几个值得留意的点：

- 注入子节点时优先用**兄弟节点**（`<>标记{children}</>`）而不是 `<div>` 包裹 ——
  宿主的 `dialog-content` 是 `grid gap-4`、`sheet-content` 是 `flex-col gap-4`，
  包一层就会吃掉所有间距，`SheetFooter` 的 `mt-auto` 也会失效。
- 只要解构了 `children`，就必须在 JSX 里把它写回去，否则会覆盖掉调用方的内容。
- 每个插槽都写成 `props: SlotProps<"…">`，55 个插槽一个不落；示例在 `strict` 下
  由 `bun run typecheck:plugins` 检查，类型来自生成给作者的那份声明。
- 调色板用 `html:root { ... }` 而不是 `:root { ... }`：宿主的 `:root` / `.dark`
  令牌同样是未分层样式，`html:root` 的特异性（0,1,1）高一级，不依赖注入顺序。
- 本插件的 `ui/styles.css` 故意不写 `@layer`：未分层样式永远赢过分层样式，
  所以能直接压过 Tailwind 工具类，不需要 `!important`。

# ChenifyHub 插件类型模板

这是从站点源码生成的类型声明，**不属于你的插件包**。解压后放在插件目录的隔壁：

```
workspace/
├── my-plugin/                 ← 拖进 /plugins 的只有这个
│   ├── plugin.json
│   ├── ui/button.tsx
│   └── tsconfig.json          ← { "extends": "../chenify-plugin-types/tsconfig.json", "include": ["ui"] }
└── chenify-plugin-types/      ← 本目录
```

## 依赖

```bash
npm i -D typescript @types/react
```

这样就能开始写了：`card*` `input` `label` `skeleton` `dropdownMenuShortcut`
`dialogHeader/Footer` `sheetHeader/Footer` 这些纯 DOM 的插槽立刻是字段级精确的。

其余插槽（`button` `badge` `checkbox` `separator` `tabs*` `dialog*`
`sheet*` `dropdownMenu*` `tooltip*`）的 props 来自 Base UI 原语。**不装
`@base-ui/react` 也能编** —— 那部分 props 退化成 `any`，不报错、也不校验。
想要字段级类型，就按站点的版本补上这几个包：

```bash
npm i -D @base-ui/react class-variance-authority lucide-react
```

`lucide-react` 只在用图标时需要，版本对着站点 `package.json` 抄。

## 怎么用

```tsx
import { cn } from "@/lib/utils";
import { useHostUI, type SlotProps } from "@/plugins/api";

export default function Button(props: SlotProps<"button">) {
    const Host = useHostUI("button");
    if (!Host) return null;
    return <Host {...props} className={cn("rounded-full", props.className)} />;
}
```

`plugin.json` 也有校验：把 `plugin.schema.json` 拷一份到插件根目录，
编辑器就会补全插槽名，并把拼错的、未声明的插槽标红。

宿主改过组件 props 后，这个类型包是旧的；重新下载即可。

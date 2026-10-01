/**
 * 终端插件的公共注入助手。
 *
 * 这里只导出「如何往宿主组件里放东西」的三个小构件，不导出宿主实现：
 * 每个插槽文件都必须自己用 useHostUI(<slot>) 拿宿主默认实现。
 * 从 "@/components/ui/*" import 拿到的是已被插件替换过的版本，赋回同一插槽会无限递归。
 *
 * 插件包内普通的 .tsx 文件同样过类型检查（宿主只转译、不检查，但作者自己可以查），
 * 所以这三个小构件也老老实实标了 props 类型。
 */
import type { ReactNode } from "react";

/** 注入用的小构件的 props：只用到 children 与 className，够用即可。 */
type DecorProps = { children?: ReactNode; className?: string };

/**
 * 装饰性标记（前缀符号）。
 *
 * 以兄弟节点的形式注入，宿主的 children 依然是原父容器的直接子项 ——
 * flex/grid 的 gap、SheetFooter 的 mt-auto 之类的布局语义完全不受影响。
 * 这是 R1-2 规则：父容器带 gap 时，注入标记绝不能用一个 <div> 把 children 包起来。
 */
export function Mark({ children, className = "term-mark" }: DecorProps) {
    return (
        <span className={className} aria-hidden="true">
            {children}
        </span>
    );
}

/**
 * 紧凑包裹（方括号一类需要贴住内容的装饰）。
 *
 * 整段合成一个子项，父容器仍然只看到 1 个 flex/grid item，
 * 不会因为注入而凭空多出一道 gap。这是 R1-1 规则。
 */
export function Tag({ children, className = "term-tag" }: DecorProps) {
    return <span className={className}>{children}</span>;
}

/**
 * 终端窗口标题栏，注入进弹窗 popup 的第一个格子。
 *
 * 只能作为兄弟节点插入（grid/flex 的首项），绝不能把 popup 的 children 整个
 * 包进一个新盒子：dialog-content 是 grid gap-4、sheet-content 是 flex-col gap-4，
 * 包一层就会吃掉所有间距，SheetFooter 的 mt-auto 也会因此失效。
 */
export function TitleBar({ label = "window" }: { label?: string }) {
    return (
        <div className="term-titlebar" aria-hidden="true">
            <span className="term-titlebar-mark">▌</span>
            <span className="term-titlebar-name">{label}</span>
            <span className="term-titlebar-rule" />
        </div>
    );
}

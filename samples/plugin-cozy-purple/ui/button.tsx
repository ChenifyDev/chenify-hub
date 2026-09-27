import { useHostUI } from "@/plugins/api";
import { cn } from "@/lib/utils";

/**
 * 在宿主 Button 的基础上加一点自己的样式，而不是重写一遍。
 *
 * useHostUI("button") 拿到的是宿主默认实现（不含插件替换），
 * 从 "@/components/ui/button" import 拿到的则是已经被替换过的版本，直接再赋回同一插槽会无限递归。
 */
export default function Button(props) {
    const Host = useHostUI("button");
    if (!Host) return null;

    return <Host {...props} className={cn("rounded-full font-semibold tracking-wide", props.className)} />;
}

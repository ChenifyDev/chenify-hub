import { useHostUI, type SlotProps } from "@/plugins/api";

/** 结构保持宿主的四段式，终端外观（方角边框、底色）交给 [data-slot="card"]。 */
export default function Card(props: SlotProps<"card">) {
    const Host = useHostUI("card");
    if (!Host) return null;
    return <Host {...props} />;
}

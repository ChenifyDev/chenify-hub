import { FileText } from "lucide-react";
import PostDraftList from "@/components/forum/drafts/DraftList.tsx";
import { Page, PageHeader } from "@/components/layout/Page.tsx";

export default function Drafts() {
    return (
        <Page>
            <PageHeader icon={FileText} title="草稿管理" description="管理你的未发布内容和已发布的帖子" />
            <PostDraftList />
        </Page>
    );
}

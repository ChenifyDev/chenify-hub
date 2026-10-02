import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Save, Send } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import EditorField from "@/components/forum/MarkdownEditor.tsx";
import { ImagePicker } from "@/components/forum/write/ImagePicker.tsx";
import { Page } from "@/components/layout/Page.tsx";
import { TagInput } from "@/components/forum/write/TagInput.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Input } from "@/components/ui/input.tsx";
import { useDraftPersistence } from "@/hooks/useDraftPersistence.ts";
import { createDraft, updateDraft, publishDraft, type Draft, getDraft } from "@/lib/api";
import { parseFrontmatter, withTitle } from "@/lib/frontmatter.ts";
import { splitTags } from "@/lib/tags.ts";
import { urlToFile } from "@/lib/utils.ts";

const MAX_IMAGES = 9;
const MAX_CONTENT_LENGTH = 20000;

export default function Write() {
    const navigate = useNavigate();
    const [searchParams, _] = useSearchParams();
    const currentId = searchParams.get("id");

    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [status, setStatus] = useState<Draft["status"]>("draft");
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dirty, setDirty] = useState(false);
    const saveDraftRef = useRef<() => Promise<void>>(async () => {});
    const { content, setContent, title, setTitle, commentArea, setCommentArea, tagInput, setTagInput, clear } =
        useDraftPersistence(currentId);

    useEffect(() => {
        let ignore = false;
        const func = async () => {
            if (!currentId) return;
            try {
                const data = await getDraft(Number(currentId));
                const { title: draftTitle, commentArea: draftCommentArea, body } = parseFrontmatter(data.content);
                if (ignore) return;
                setTitle(draftTitle ?? "");
                setCommentArea(draftCommentArea);
                setContent(body);
                setTagInput(data.tags.join(" "));
                setStatus(data.status);
                const imgs: File[] = [];
                for (const url of data.images) {
                    const file = await urlToFile(url);
                    if (!file) continue;
                    imgs.push(file);
                }
                if (ignore) return;
                setImageFiles(imgs);
                setDirty(false);
            } catch (err) {
                if (!ignore) setError(err instanceof Error ? err.message : "草稿加载失败");
            }
        };
        if (!ignore) func().then();
        return () => {
            ignore = true;
        };
    }, [currentId, setTitle, setCommentArea, setContent, setTagInput]);

    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (!dirty) return;
            e.preventDefault();
        };
        window.addEventListener("beforeunload", handler);
        return () => {
            window.removeEventListener("beforeunload", handler);
        };
    }, [dirty]);

    const tags = splitTags(tagInput);

    const handleSaveDraft = useCallback(async () => {
        setSaving(true);
        setMessage(null);
        setError(null);
        try {
            const finalContent = withTitle(title, content, commentArea);
            const draft: Draft = currentId
                ? await updateDraft(Number(currentId), finalContent, imageFiles, tags)
                : await createDraft(finalContent, imageFiles, tags);
            setStatus(draft.status);
            setDirty(false);
            setMessage(draft.status === "published" ? "帖子已更新" : `草稿已保存（#${draft.id}）`);
            clear();
        } catch (err) {
            setError(err instanceof Error ? err.message : "保存草稿失败");
        } finally {
            setSaving(false);
        }
    }, [tags, content, title, commentArea, imageFiles, currentId, clear]);

    useEffect(() => {
        saveDraftRef.current = handleSaveDraft;
    }, [handleSaveDraft]);

    const handleContentChange = (v: string) => {
        setContent(v);
        setDirty(true);
    };

    const handleTagInputChange = (v: string) => {
        setTagInput(v);
        setDirty(true);
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
        setDirty(true);
    };

    const handlePickImages = (files: FileList | null) => {
        if (!files) return;
        const next = [...imageFiles, ...Array.from(files)].slice(0, MAX_IMAGES);
        setImageFiles(next);
        setDirty(true);
    };

    const removeImage = (index: number) => {
        setImageFiles((prev) => prev.filter((_, i) => i !== index));
        setDirty(true);
    };

    const handlePublish = async () => {
        if (!content.trim()) return;
        setPublishing(true);
        setMessage(null);
        setError(null);
        try {
            const finalContent = withTitle(title, content, commentArea);
            if (currentId) {
                const draft = await updateDraft(Number(currentId), finalContent, imageFiles, tags);
                setStatus(draft.status);
                setDirty(false);
                if (draft.status === "published" && draft.post_id != null) {
                    navigate(`/posts/${draft.post_id}`);
                    return;
                }
                const post = await publishDraft(Number(currentId));
                clear();
                navigate(`/posts/${post.id}`);
            } else {
                const draft = await createDraft(finalContent, imageFiles, tags);
                const post = await publishDraft(draft.id);
                setDirty(false);
                clear();
                navigate(`/posts/${post.id}`);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "发布失败");
        } finally {
            setPublishing(false);
        }
    };

    return (
        <Page>
            <Card>
                <CardContent className="grid gap-4">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon-sm" aria-label="返回" onClick={() => navigate(-1)}>
                            <ArrowLeft />
                        </Button>
                        <div className="grid min-w-0 flex-1 gap-0.5">
                            <h1 className="text-base font-semibold">写帖子</h1>
                            <p className="text-xs text-muted-foreground">
                                {withTitle(title, content, commentArea).length > MAX_CONTENT_LENGTH
                                    ? `内容已超过 ${MAX_CONTENT_LENGTH} 字`
                                    : `支持富文本与 LaTeX 数学公式，写作后可保存草稿或直接发布`}
                            </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={saving || publishing}
                                onClick={() => void handleSaveDraft()}
                            >
                                {saving ? <Loader2 className="animate-spin" /> : <Save />}
                                {saving ? "保存中…" : "保存草稿"}
                            </Button>
                            <Button
                                size="sm"
                                disabled={publishing || saving || !content.trim()}
                                onClick={() => void handlePublish()}
                            >
                                {publishing ? <Loader2 className="animate-spin" /> : <Send />}
                                {publishing ? "保存中…" : status === "published" ? "保存并更新" : "发布"}
                            </Button>
                        </div>
                    </div>

                    {message && <p className="text-sm text-primary">{message}</p>}
                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <div className="grid gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">标题（可选）</span>
                        <Input value={title} onChange={handleTitleChange} placeholder="给文章起个标题…" />
                    </div>

                    <label htmlFor="comment-area" className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                            id="comment-area"
                            checked={commentArea}
                            onCheckedChange={(v) => setCommentArea(Boolean(v))}
                        />
                        允许评论
                    </label>

                    <EditorField value={content} onChange={handleContentChange} />

                    <div className="grid gap-3 border-t pt-4">
                        <TagInput value={tagInput} onChange={handleTagInputChange} tags={tags} />

                        <ImagePicker
                            images={imageFiles}
                            max={MAX_IMAGES}
                            onPick={handlePickImages}
                            onRemove={removeImage}
                        />
                    </div>
                </CardContent>
            </Card>
        </Page>
    );
}

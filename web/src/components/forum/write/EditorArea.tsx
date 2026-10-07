import { useState, type ReactNode } from "react";
import { Eye, FileCode2, PenLine } from "lucide-react";

import EditorField from "@/components/forum/MarkdownEditor.tsx";
import { Markdown } from "@/components/forum/Markdown.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip.tsx";

type EditorMode = "edit" | "markdown" | "preview";

function ModeTab({ value, label, icon }: { value: EditorMode; label: string; icon: ReactNode }) {
    return (
        <Tooltip>
            <TooltipTrigger
                render={
                    <TabsTrigger value={value} aria-label={label}>
                        {icon}
                    </TabsTrigger>
                }
            />
            <TooltipContent>
                <p>{label}</p>
            </TooltipContent>
        </Tooltip>
    );
}

export default function EditorArea({ value, onChange }: { value: string; onChange: (value: string) => void }) {
    const [mode, setMode] = useState<EditorMode>("edit");

    return (
        <Tabs value={mode} onValueChange={(v) => setMode(v as EditorMode)} className="w-full gap-1.5">
            <TabsList className="ml-auto">
                <ModeTab value="edit" label="编辑器" icon={<PenLine />} />
                <ModeTab value="markdown" label="Markdown" icon={<FileCode2 />} />
                <ModeTab value="preview" label="预览" icon={<Eye />} />
            </TabsList>
            <TabsContent value="edit">
                <EditorField value={value} onChange={onChange} />
            </TabsContent>
            <TabsContent value="markdown">
                <Textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="直接编辑 Markdown 源文本…"
                    spellCheck={false}
                    className="min-h-[40vh] resize-y font-mono text-sm"
                />
            </TabsContent>
            <TabsContent value="preview">
                <div className="min-h-[40vh] overflow-hidden rounded-lg border border-border">
                    {value.trim() ? (
                        <Markdown content={value} className="p-4" />
                    ) : (
                        <p className="p-4 text-sm text-muted-foreground">暂无内容，先写点什么吧</p>
                    )}
                </div>
            </TabsContent>
        </Tabs>
    );
}

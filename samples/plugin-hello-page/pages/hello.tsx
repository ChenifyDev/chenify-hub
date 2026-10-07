import { Link, useNavigate } from "react-router-dom";

import { plugin } from "@/plugins/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HelloPage() {
    const navigate = useNavigate();
    return (
        <div className="mx-auto w-full max-w-2xl space-y-4 p-6">
            <Card>
                <CardHeader>
                    <CardTitle>你好，插件页面</CardTitle>
                    <CardDescription>
                        这个页面由 Hello Page 插件提供，路由是 <code className="font-mono">/plugin/hello</code>。
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    <Button onClick={() => plugin.navigate("/")}>plugin.navigate 回首页</Button>
                    <Button variant="outline" onClick={() => navigate("/explore-posts")}>
                        useNavigate 去帖子
                    </Button>
                    <Link
                        to="/plugins"
                        className={cn(
                            "inline-flex h-9 items-center rounded-md border border-input px-4 text-sm",
                            "hover:bg-accent hover:text-accent-foreground",
                        )}
                    >
                        Link 去插件管理
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}

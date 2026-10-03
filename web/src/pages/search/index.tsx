import { useEffect, useState } from "react";
import { Clock, Flame, Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import SearchBox from "@/components/search/SearchBox.tsx";
import { Page, PageHeader } from "@/components/layout/Page.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.tsx";

import PostsTab from "@/pages/search/PostsTab.tsx";
import UsersTab from "@/pages/search/UsersTab.tsx";
import Empty from "@/components/tab/Empty.tsx";

type SearchType = "posts" | "users";

export default function SearchPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const keyword = searchParams.get("q") ?? "";
    const type = (searchParams.get("type") ?? "posts") as SearchType;
    const sort = searchParams.get("sort") === "latest" ? "latest" : "hot";
    const [input, setInput] = useState(keyword);

    useEffect(() => {
        setInput(keyword);
    }, [keyword]);

    const updateParam = (key: string, value: string) => {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set(key, value);
            return next;
        });
    };

    const tabKey = `${keyword}:${type}:${sort}`;

    return (
        <Page className="max-w-none">
            <PageHeader icon={Search} title="搜索" description="搜索社区里的帖子和用户" />

            <SearchBox value={input} onValueChange={setInput} onSubmit={(k) => updateParam("q", k)} className="mb-4" />

            {!keyword ? (
                <Empty text="输入关键词开始搜索" />
            ) : (
                <Tabs
                    className="w-full"
                    value={type}
                    onValueChange={(value) => updateParam("type", value as SearchType)}
                >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <TabsList>
                            <TabsTrigger value="posts">帖子</TabsTrigger>
                            <TabsTrigger value="users">用户</TabsTrigger>
                        </TabsList>
                        {type !== "users" && (
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant={sort === "hot" ? "default" : "outline"}
                                    onClick={() => updateParam("sort", "hot")}
                                >
                                    <Flame />
                                    热门
                                </Button>
                                <Button
                                    size="sm"
                                    variant={sort === "latest" ? "default" : "outline"}
                                    onClick={() => updateParam("sort", "latest")}
                                >
                                    <Clock />
                                    最新
                                </Button>
                            </div>
                        )}
                    </div>
                    <TabsContent value="posts" className="pt-4">
                        <PostsTab key={tabKey} keyword={keyword} sort={sort} />
                    </TabsContent>
                    <TabsContent value="users" className="pt-4">
                        <UsersTab key={tabKey} keyword={keyword} />
                    </TabsContent>
                </Tabs>
            )}
        </Page>
    );
}

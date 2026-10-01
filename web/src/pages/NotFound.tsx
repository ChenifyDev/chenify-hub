import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";

export default function NotFound() {
    const navigate = useNavigate();
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-2 p-4">
            <h1 className="text-8xl font-bold text-primary">404</h1>
            <p className="text-muted-foreground">页面未找到</p>
            <div className="mt-4 flex gap-3">
                <Button onClick={() => navigate("/explore-posts")}>回到社区</Button>
                <Button variant="outline" onClick={() => navigate(-1)}>
                    返回上一页
                </Button>
            </div>
        </div>
    );
}

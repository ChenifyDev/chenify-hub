import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "app-bg-image";
const BLUR_STORAGE_KEY = "app-bg-blur";
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_DIMENSION = 1920;
const WEBP_QUALITY = 0.8;

function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(image);
        };
        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("图片加载失败"));
        };
        image.src = objectUrl;
    });
}

function readFileAsDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("读取文件失败"));
        reader.readAsDataURL(blob);
    });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
    return new Promise((resolve) => canvas.toBlob(resolve, "image/webp", WEBP_QUALITY));
}

async function compressToWebp(file: File): Promise<Blob> {
    const image = await loadImage(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 不可用");
    context.drawImage(image, 0, 0, width, height);

    const blob = await canvasToBlob(canvas);
    if (!blob || !blob.type.startsWith("image/webp")) {
        throw new Error("浏览器不支持 webp 编码");
    }
    return blob;
}

export function useBackgroundImage({ onError }: { onError?: (message: string) => void } = {}) {
    const [url, setUrl] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
    const [blur, setBlurState] = useState<boolean>(() => localStorage.getItem(BLUR_STORAGE_KEY) !== "off");

    useEffect(() => {
        if (url) {
            document.body.style.backgroundImage = `url(${url})`;
            document.body.style.backgroundSize = "cover";
            document.body.style.backgroundPosition = "center";
            document.body.style.backgroundAttachment = "fixed";
        } else {
            document.body.style.backgroundImage = "";
            document.body.style.backgroundSize = "";
            document.body.style.backgroundPosition = "";
            document.body.style.backgroundAttachment = "";
        }
    }, [url]);

    useEffect(() => {
        if (url) {
            document.body.classList.add("app-bg-active");
        } else {
            document.body.classList.remove("app-bg-active");
        }
    }, [url]);

    useEffect(() => {
        if (url && blur) {
            document.body.classList.add("app-bg-blur");
        } else {
            document.body.classList.remove("app-bg-blur");
        }
    }, [url, blur]);

    const setBlur = useCallback((value: boolean) => {
        setBlurState(value);
        localStorage.setItem(BLUR_STORAGE_KEY, value ? "on" : "off");
    }, []);

    const setBackground = useCallback(
        async (file: File | null) => {
            if (!file) {
                setUrl(null);
                localStorage.removeItem(STORAGE_KEY);
                return;
            }

            if (!ALLOWED_TYPES.includes(file.type)) {
                onError?.("背景图片仅支持 png、jpg、webp、gif 格式");
                return;
            }

            let result: string;
            try {
                const blob = await compressToWebp(file);
                if (blob.size > MAX_SIZE) {
                    onError?.("压缩后图片仍超过 5MB，请选择较小的图片");
                    return;
                }
                result = await readFileAsDataURL(blob);
            } catch (err) {
                onError?.(err instanceof Error ? err.message : "图片压缩失败");
                return;
            }

            setUrl(result);
            try {
                localStorage.setItem(STORAGE_KEY, result);
            } catch {
                onError?.("背景图片过大，无法本地保存");
            }
        },
        [onError],
    );

    const removeBackground = useCallback(() => {
        void setBackground(null);
    }, [setBackground]);

    return { url, blur, setBlur, setBackground, removeBackground };
}

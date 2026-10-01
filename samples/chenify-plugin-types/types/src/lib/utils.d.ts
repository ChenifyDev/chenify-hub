import { type ClassValue } from "clsx";
export declare function cn(...inputs: ClassValue[]): string;
/**
 * 把草稿里保存的图片 URL 重新拉取为本地 File（跨域 CORS），
 * 供写帖页把已有草稿图片回填进编辑器以便再次提交；失败时返回 undefined。
 * 文件名用 uuid 占位，上传时服务端会重新取名。
 */
export declare function urlToFile(imageUrl: string): Promise<File | undefined>;

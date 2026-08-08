import { useRef, useState } from "react";
import { ImagePlus, Trash2, Loader2 } from "lucide-react";
import { fileToCompressedDataUrl } from "@/utils/image";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
}

export default function ImageUpload({ value, onChange }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    setLoading(true);
    setError("");
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      onChange(dataUrl);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-start gap-4">
      <div
        className={cn(
          "relative w-28 h-28 shrink-0 border-2 border-dashed border-neon-cyan/30 rounded-sm overflow-hidden bg-steel-900 flex items-center justify-center",
          value && "border-solid border-neon-cyan/40"
        )}
      >
        {value ? (
          <>
            <img src={value} alt="配件图片" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="absolute top-1 right-1 p-1 bg-neon-pink/80 text-white rounded-sm hover:bg-neon-pink"
              title="删除图片"
            >
              <Trash2 size={12} />
            </button>
          </>
        ) : loading ? (
          <Loader2 size={24} className="text-neon-cyan animate-spin" />
        ) : (
          <ImagePlus size={28} className="text-steel-500" />
        )}
      </div>
      <div className="pt-1">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="px-3 py-1.5 text-sm font-medium neon-btn rounded-sm disabled:opacity-50"
        >
          {value ? "更换图片" : "上传图片"}
        </button>
        <p className="mt-1.5 text-xs text-steel-500">
          选填，用于辨认相似配件；自动压缩存储
        </p>
        {error && <p className="mt-1 text-xs text-neon-pink">{error}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

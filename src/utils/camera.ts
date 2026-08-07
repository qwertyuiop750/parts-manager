import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

/**
 * 调用相机/相册获取图片，返回压缩后的 data URL。
 * - 原生（Android）：使用 Capacitor Camera，弹出"拍照/相册"选择
 * - Web：返回 null，由组件用 <input type=file> 处理
 */
export async function captureImage(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;
  const photo = await Camera.getPhoto({
    quality: 85,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Prompt,
    promptLabelPhoto: "从相册选择",
    promptLabelPicture: "拍照",
    promptLabelCancel: "取消",
    correctOrientation: true,
  });
  if (!photo.dataUrl) return null;
  // 表格识别需要较高分辨率，统一压缩到 1280px
  return compressDataUrl(photo.dataUrl, 1280, 0.85);
}

/** 将任意 data URL 通过 canvas 压缩到指定尺寸 */
export function compressDataUrl(
  dataUrl: string,
  maxSize = 1280,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > height && width > maxSize) {
        height = Math.round((height * maxSize) / width);
        width = maxSize;
      } else if (height > maxSize) {
        width = Math.round((width * maxSize) / height);
        height = maxSize;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("无法处理图片"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = dataUrl;
  });
}

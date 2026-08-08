/**
 * 调用相机/相册获取图片，返回压缩后的 data URL。
 * - HBuilderX 5+ 原生：使用 plus.gallery.pick / plus.camera.getCamera()
 * - Web：返回 null，由组件用 <input type=file> 处理
 */
export async function captureImage(): Promise<string | null> {
  // @ts-ignore
  if (typeof plus === 'undefined') return null;

  // @ts-ignore
  const p = plus;

  return new Promise<string | null>((resolve) => {
    // 弹出选择：拍照 or 相册
    p.nativeUI.actionSheet(
      { title: '选择图片来源', cancel: '取消', buttons: [{ title: '拍照' }, { title: '从相册选择' }] },
      (e: { index: number }) => {
        if (e.index === 1) {
          // 拍照
          const cmr = p.camera.getCamera();
          cmr.captureImage(
            (path: string) => {
              // 读取文件为 base64
              p.io.resolveLocalFileSystemURL(
                path,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (entry: any) => {
                  entry.file((f: File) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                      const dataUrl = reader.result as string;
                      resolve(compressDataUrl(dataUrl, 1280, 0.85));
                    };
                    reader.onerror = () => resolve(null);
                    reader.readAsDataURL(f);
                  });
                },
                () => resolve(null)
              );
            },
            () => resolve(null),
            { filename: '_doc/camera/', optimize: true }
          );
        } else if (e.index === 2) {
          // 相册
          p.gallery.pick(
            (path: string) => {
              p.io.resolveLocalFileSystemURL(
                path,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (entry: any) => {
                  entry.file((f: File) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                      const dataUrl = reader.result as string;
                      resolve(compressDataUrl(dataUrl, 1280, 0.85));
                    };
                    reader.onerror = () => resolve(null);
                    reader.readAsDataURL(f);
                  });
                },
                () => resolve(null)
              );
            },
            () => resolve(null),
            { filter: 'image', multiple: false }
          );
        } else {
          resolve(null);
        }
      }
    );
  });
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

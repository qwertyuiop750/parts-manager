import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Save, ArrowLeft, MapPin, Package, Boxes, AlertCircle } from "lucide-react";
import type { Part, PartFormData } from "@/types";
import { usePartsStore } from "@/store/usePartsStore";
import { locationPath } from "@/utils/format";
import Field, { inputCls } from "@/components/form/Field";
import ImageUpload from "@/components/ImageUpload";

interface PartFormProps {
  mode: "add" | "edit";
  initial?: Part;
}

const UNITS = ["个", "件", "套", "组", "对", "米", "kg"];

export default function PartForm({ mode, initial }: PartFormProps) {
  const navigate = useNavigate();
  const addPart = usePartsStore((s) => s.addPart);
  const updatePart = usePartsStore((s) => s.updatePart);

  const [form, setForm] = useState<PartFormData>(() => ({
    name: initial?.name ?? "",
    spec: initial?.spec ?? "",
    category: initial?.category ?? "",
    unit: initial?.unit ?? "个",
    zone: initial?.zone ?? "",
    shelf: initial?.shelf ?? "",
    layer: initial?.layer ?? "",
    bin: initial?.bin ?? "",
    quantity: initial?.quantity ?? 0,
    safetyStock: initial?.safetyStock ?? 0,
    remark: initial?.remark ?? "",
    image: initial?.image,
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const latestForm = useRef(form);
  useEffect(() => {
    latestForm.current = form;
  });

  useEffect(() => {
    if (submitAttempted && Object.keys(errors).length > 0) {
      const firstErrorKey = Object.keys(errors)[0];
      const errorElement = containerRef.current?.querySelector(`[data-field="${firstErrorKey}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [errors, submitAttempted]);

  const set = <K extends keyof PartFormData>(key: K, value: PartFormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  const doSave = () => {
    setSubmitAttempted(true);
    const current = latestForm.current;
    const errs: Record<string, string> = {};
    if (!current.name.trim()) errs.name = "请输入中文名";
    if (!current.spec.trim()) errs.spec = "请输入规格";
    if (!current.zone.trim()) errs.zone = "请输入库区";
    if (!current.shelf.trim()) errs.shelf = "请输入货架";
    if (!current.layer.trim()) errs.layer = "请输入层";
    if (!current.bin.trim()) errs.bin = "请输入位";
    if (current.quantity < 0) errs.quantity = "数量不能为负";
    if (current.safetyStock < 0) errs.safetyStock = "不能为负";

    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      const firstError = Object.keys(errs)[0];
      setTimeout(() => {
        const element = containerRef.current?.querySelector(`[data-field="${firstError}"]`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
      return;
    }

    const data: PartFormData = {
      ...current,
      name: current.name.trim(),
      spec: current.spec.trim(),
      category: current.category.trim(),
      zone: current.zone.trim(),
      shelf: current.shelf.trim(),
      layer: current.layer.trim(),
      bin: current.bin.trim(),
      remark: current.remark.trim(),
    };

    if (mode === "edit" && initial) {
      updatePart(initial.id, data);
      navigate(`/detail/${initial.id}`);
    } else {
      const part = addPart(data);
      navigate(`/detail/${part.id}`);
    }
  };

  const locPath = locationPath(form);
  const errorCount = Object.keys(errors).length;

  return (
    <div ref={containerRef} className="space-y-6 max-w-3xl animate-fade-up">
      {/* 顶部操作栏 */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-steel-400 hover:text-neon-cyan min-h-[44px] min-w-[44px] justify-center"
        >
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">返回</span>
        </button>
        <h2 className="text-lg font-bold text-neon-cyan neon-text">
          {mode === "edit" ? "编辑配件" : "新增配件"}
        </h2>
        <button
          type="button"
          onClick={doSave}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold neon-btn rounded-sm min-h-[44px]"
        >
          <Save size={16} strokeWidth={2.5} />
          保存
        </button>
      </div>

      {/* 验证错误摘要 */}
      {submitAttempted && errorCount > 0 && (
        <div className="bg-neon-pink/10 border border-neon-pink/30 rounded-sm p-4 flex items-start gap-3 shadow-[0_0_10px_rgba(255,0,110,0.1)]">
          <AlertCircle size={20} className="text-neon-pink flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-neon-pink">
              有 {errorCount} 个字段需要填写
            </p>
            <p className="text-xs text-steel-400 mt-1">
              请向下滚动查看并填写所有必填项
            </p>
          </div>
        </div>
      )}

      {/* 基本信息 */}
      <section className="cyber-card rounded-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 bg-steel-800/80 border-b border-neon-cyan/20">
          <Package size={18} className="text-neon-cyan" />
          <h3 className="font-bold text-steel-200">基本信息</h3>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div data-field="name">
            <Field label="中文名" required error={errors.name}>
              <input
                className={inputCls}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="如：六角螺栓"
              />
            </Field>
          </div>
          <div data-field="spec">
            <Field label="规格" required error={errors.spec}>
              <input
                className={`${inputCls} font-mono-num`}
                value={form.spec}
                onChange={(e) => set("spec", e.target.value)}
                placeholder="如：M8×30"
              />
            </Field>
          </div>
          <div data-field="category">
            <Field label="分类">
              <input
                className={inputCls}
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="如：紧固件、电气、气动"
              />
            </Field>
          </div>
          <div data-field="unit">
            <Field label="单位">
              <select
                className={inputCls}
                value={form.unit}
                onChange={(e) => set("unit", e.target.value)}
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div data-field="remark" className="sm:col-span-2">
            <Field label="备注">
              <textarea
                className={`${inputCls} min-h-[72px] resize-y`}
                value={form.remark}
                onChange={(e) => set("remark", e.target.value)}
                placeholder="补充说明…"
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-steel-300 mb-1.5 block">
              配件图片
            </label>
            <ImageUpload
              value={form.image}
              onChange={(url) => set("image", url)}
            />
          </div>
        </div>
      </section>

      {/* 位置信息 */}
      <section className="cyber-card rounded-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 bg-steel-800/80 border-b border-neon-cyan/20">
          <MapPin size={18} className="text-neon-cyan" />
          <h3 className="font-bold text-steel-200">位置信息 <span className="text-neon-pink text-sm font-normal">（必填）</span></h3>
        </div>
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div data-field="zone">
            <Field label="库区" required error={errors.zone}>
              <input
                className={`${inputCls} font-mono-num`}
                value={form.zone}
                onChange={(e) => set("zone", e.target.value)}
                placeholder="A区"
              />
            </Field>
          </div>
          <div data-field="shelf">
            <Field label="货架" required error={errors.shelf}>
              <input
                className={`${inputCls} font-mono-num`}
                value={form.shelf}
                onChange={(e) => set("shelf", e.target.value)}
                placeholder="货架03"
              />
            </Field>
          </div>
          <div data-field="layer">
            <Field label="层" required error={errors.layer}>
              <input
                className={`${inputCls} font-mono-num`}
                value={form.layer}
                onChange={(e) => set("layer", e.target.value)}
                placeholder="第2层"
              />
            </Field>
          </div>
          <div data-field="bin">
            <Field label="位" required error={errors.bin}>
              <input
                className={`${inputCls} font-mono-num`}
                value={form.bin}
                onChange={(e) => set("bin", e.target.value)}
                placeholder="A位"
              />
            </Field>
          </div>
          {locPath && (
            <div className="col-span-2 sm:col-span-4 mt-1">
              <p className="text-xs text-steel-500 mb-1">位置预览：</p>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 rounded-sm font-mono-num text-sm shadow-[0_0_8px_rgba(0,240,255,0.15)]">
                <MapPin size={14} strokeWidth={2.5} />
                {locPath}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* 库存设置 */}
      <section className="cyber-card rounded-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 bg-steel-800/80 border-b border-neon-cyan/20">
          <Boxes size={18} className="text-neon-cyan" />
          <h3 className="font-bold text-steel-200">库存设置</h3>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div data-field="quantity">
            <Field
              label={mode === "edit" ? "当前库存" : "初始数量"}
              error={errors.quantity}
              hint="低于或等于安全库存时将预警"
            >
              <input
                type="number"
                min={0}
                className={`${inputCls} font-mono-num`}
                value={form.quantity}
                onChange={(e) => set("quantity", Number(e.target.value))}
              />
            </Field>
          </div>
          <div data-field="safetyStock">
            <Field label="安全库存阈值" error={errors.safetyStock}>
              <input
                type="number"
                min={0}
                className={`${inputCls} font-mono-num`}
                value={form.safetyStock}
                onChange={(e) => set("safetyStock", Number(e.target.value))}
                placeholder="低于此值预警"
              />
            </Field>
          </div>
        </div>
      </section>

      {/* 底部保存按钮 */}
      <div className="flex justify-end gap-2 pb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 text-sm font-medium text-steel-400 bg-steel-800 hover:bg-steel-700 border border-steel-700 rounded-sm transition-colors min-h-[44px]"
        >
          取消
        </button>
        <button
          type="button"
          onClick={doSave}
          className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold neon-btn rounded-sm min-h-[44px]"
        >
          <Save size={16} strokeWidth={2.5} />
          保存配件
        </button>
      </div>
    </div>
  );
}

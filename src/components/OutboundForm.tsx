import { useState } from "react";
import { Minus, PackageMinus } from "lucide-react";
import { usePartsStore } from "@/store/usePartsStore";
import { inputCls } from "@/components/form/Field";
import type { Part } from "@/types";

interface OutboundFormProps {
  part: Part;
}

export default function OutboundForm({ part }: OutboundFormProps) {
  const addOutbound = usePartsStore((s) => s.addOutbound);
  const [quantity, setQuantity] = useState(1);
  const [receiver, setReceiver] = useState("");
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) {
      setError("出库数量需大于 0");
      return;
    }
    if (quantity > part.quantity) {
      setError(`数量超过当前库存（${part.quantity}）`);
      return;
    }
    if (!receiver.trim()) {
      setError("请输入领用人");
      return;
    }
    const ok = addOutbound(part.id, quantity, receiver, remark);
    if (ok) {
      setQuantity(1);
      setReceiver("");
      setRemark("");
      setError("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="cyber-card rounded-sm overflow-hidden"
    >
      <div className="flex items-center gap-2 px-5 py-3 bg-steel-800/80 border-b border-neon-cyan/20">
        <PackageMinus size={18} className="text-neon-cyan" />
        <h3 className="font-bold text-steel-200">出库登记</h3>
      </div>
      <div className="p-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-steel-300">
              出库数量
            </label>
            <input
              type="number"
              min={1}
              max={part.quantity}
              className={`${inputCls} font-mono-num mt-1`}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-steel-300">
              领用人<span className="text-neon-pink ml-0.5">*</span>
            </label>
            <input
              className={`${inputCls} mt-1`}
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              placeholder="工人姓名"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-steel-300">备注</label>
          <input
            className={`${inputCls} mt-1`}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="选填"
          />
        </div>
        {error && <p className="text-sm text-neon-pink">{error}</p>}
        <button
          type="submit"
          disabled={part.quantity <= 0}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm font-bold neon-btn rounded-sm disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Minus size={16} strokeWidth={2.5} />
          确认出库
        </button>
      </div>
    </form>
  );
}

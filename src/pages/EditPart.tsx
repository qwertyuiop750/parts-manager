import { useParams, Navigate } from "react-router-dom";
import { usePartsStore } from "@/store/usePartsStore";
import Layout from "@/components/Layout";
import PartForm from "@/components/PartForm";

export default function EditPart() {
  const { id } = useParams<{ id: string }>();
  const part = usePartsStore((s) => s.parts.find((p) => p.id === id));

  if (!id || !part) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <PartForm mode="edit" initial={part} />
    </Layout>
  );
}

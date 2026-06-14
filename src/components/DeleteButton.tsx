"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteProposal } from "@/app/actions/generateProposal";

interface DeleteButtonProps {
  id: string;
}

export default function DeleteButton({ id }: DeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this proposal?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await deleteProposal(id);
      if (!res.success) {
        alert("Failed to delete proposal: " + res.error);
      }
    } catch (e) {
      alert("Failed to delete proposal.");
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-gray-500 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      title="Delete Proposal"
    >
      {isDeleting ? (
        <span className="h-3.5 w-3.5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
  );
}

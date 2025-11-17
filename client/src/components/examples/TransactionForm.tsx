import { TransactionForm } from "../TransactionForm";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function TransactionFormExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>Open Transaction Form</Button>
      <TransactionForm
        open={open}
        onClose={() => setOpen(false)}
        onSave={(transaction) => console.log("Saved:", transaction)}
      />
    </div>
  );
}

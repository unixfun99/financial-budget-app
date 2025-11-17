import { ImportCSV } from "../ImportCSV";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ImportCSVExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>Open Import Dialog</Button>
      <ImportCSV
        open={open}
        onClose={() => setOpen(false)}
        onImport={(file) => console.log("Import:", file.name)}
      />
    </div>
  );
}

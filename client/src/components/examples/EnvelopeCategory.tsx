import { EnvelopeCategory } from "../EnvelopeCategory";

export default function EnvelopeCategoryExample() {
  return (
    <div className="p-6 max-w-4xl">
      <EnvelopeCategory
        name="Groceries"
        budgeted={500}
        spent={423.50}
        available={76.50}
        onBudgetChange={(amount) => console.log("Budget changed:", amount)}
        onExpand={() => console.log("Category expanded")}
      />
    </div>
  );
}

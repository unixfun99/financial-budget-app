import { AccountCard } from "../AccountCard";

export default function AccountCardExample() {
  return (
    <div className="p-6 max-w-sm">
      <AccountCard
        name="Checking Account"
        type="Checking"
        balance={5234.50}
        change={123.45}
        changePercent={2.4}
      />
    </div>
  );
}

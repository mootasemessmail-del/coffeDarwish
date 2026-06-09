import { trpc } from "@/providers/trpc";

export default function Expenses() {
  const { data, error, isLoading } = trpc.expense.list.useQuery();

  if (isLoading) return <div>Loading...</div>;

  if (error) return <pre>{error.message}</pre>;

  return (
    <pre>{JSON.stringify(data, null, 2)}</pre>
  );
}
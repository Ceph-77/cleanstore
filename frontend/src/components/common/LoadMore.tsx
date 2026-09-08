import { Button } from "./Button";

/** "Charger plus" button for cursor-paginated lists. Renders nothing at the end. */
export function LoadMore({
  hasNextPage,
  isFetching,
  onClick,
}: {
  hasNextPage: boolean;
  isFetching: boolean;
  onClick: () => void;
}) {
  if (!hasNextPage) return null;
  return (
    <div className="mt-6 flex justify-center">
      <Button variant="secondary" disabled={isFetching} onClick={onClick}>
        {isFetching ? "Chargement..." : "Charger plus"}
      </Button>
    </div>
  );
}

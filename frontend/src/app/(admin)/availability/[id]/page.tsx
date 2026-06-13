import { AvailabilityEditPage } from "./AvailabilityEditPage";

interface Props {
  params: { id: string };
}

export default function Page({ params }: Props) {
  return <AvailabilityEditPage scheduleId={params.id} />;
}

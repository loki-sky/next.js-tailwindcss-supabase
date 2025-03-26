type Props = {
  timestamp: string;
};

export default function DateFormatter({ timestamp }: Props) {
  const date = new Date(timestamp);
  const estDate = date.toLocaleString("en-US", {
    timeZone: "America/New_York",
  });

  return <>{estDate}</>;
}

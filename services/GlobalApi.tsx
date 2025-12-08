export const RunStatus = async (eventId: string) => {
  const response = await fetch(`/api/run-status?runId=${eventId}`);
  const json = await response.json();
  console.log("API Response:", json);
  return json;
};

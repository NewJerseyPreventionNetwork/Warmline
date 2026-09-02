type OpeningHoursCallback = (
    error: Error | null,
    response: { open: boolean; currentTime: string }
) => void;

export const handler = function(
    context: Record<string, string | undefined>,
    event: Record<string, string | undefined>,
    callback: OpeningHoursCallback
) {

    const now = new Date();

    const newJerseyTime = new Date(
        now.toLocaleString("en-US", {
            timeZone: "America/New_York"
        })
    );

    const day = newJerseyTime.getDay();
    const hour = newJerseyTime.getHours();

    const isWeekday = day >= 1 && day <= 5;
    const isOpen = isWeekday && hour >= 9 && hour < 16;
    callback(null, {
        open: isOpen,
        currentTime: newJerseyTime.toISOString()
    });
};
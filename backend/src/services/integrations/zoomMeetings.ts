export interface ZoomMeetingResult {
  meetingUrl: string;
  externalEventId: string;
}

export async function createZoomMeeting(
  accessToken: string,
  input: {
    topic: string;
    startTime: Date;
    durationMinutes: number;
    timezone: string;
  },
): Promise<ZoomMeetingResult> {
  const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: input.topic,
      type: 2,
      start_time: input.startTime.toISOString(),
      duration: input.durationMinutes,
      timezone: input.timezone,
      settings: {
        join_before_host: true,
        waiting_room: false,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Zoom API error: ${body}`);
  }

  const meeting = (await res.json()) as {
    id: number;
    join_url: string;
  };

  return {
    meetingUrl: meeting.join_url,
    externalEventId: String(meeting.id),
  };
}

export async function deleteZoomMeeting(
  accessToken: string,
  meetingId: string,
): Promise<void> {
  const res = await fetch(
    `https://api.zoom.us/v2/meetings/${encodeURIComponent(meetingId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!res.ok && res.status !== 404) {
    const body = await res.text();
    throw new Error(`Failed to delete Zoom meeting: ${body}`);
  }
}

export async function updateZoomMeeting(
  accessToken: string,
  meetingId: string,
  input: {
    topic: string;
    startTime: Date;
    durationMinutes: number;
    timezone: string;
  },
): Promise<void> {
  const res = await fetch(
    `https://api.zoom.us/v2/meetings/${encodeURIComponent(meetingId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: input.topic,
        start_time: input.startTime.toISOString(),
        duration: input.durationMinutes,
        timezone: input.timezone,
      }),
    },
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to update Zoom meeting: ${body}`);
  }
}
